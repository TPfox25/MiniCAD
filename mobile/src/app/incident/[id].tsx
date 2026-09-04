import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';

type Incident = {
  id: number;
  caller_name: string;
  caller_phone: string;
  location: string;
  incident_type: string;
  priority: string;
  description: string;
  status: string;
  claimed_by: string | null;
};

export default function IncidentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [summary, setSummary] = useState('');
  const [outcome, setOutcome] = useState('');

  useEffect(() => {
    loadIncident();

    const incidentChannel = supabase
      .channel(`incident-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'incidents',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setIncident(payload.new as Incident);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(incidentChannel);
    };
  }, [id]);

  async function loadIncident() {
    const { data, error } = await supabase
      .from('incidents')
      .select(
        'id, caller_name, caller_phone, location, incident_type, priority, description, status, claimed_by'
      )
      .eq('id', Number(id))
      .single();

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    setIncident(data);
    setLoading(false);
  }

  async function updateStatus(newStatus: string) {
    if (!incident) {
      return;
    }

    setUpdating(true);

    const { data, error } = await supabase.rpc(
      'update_incident_status',
      {
        p_incident_id: incident.id,
        p_new_status: newStatus,
      }
    );

    if (error) {
      Alert.alert('Unable to update incident', error.message);
      setUpdating(false);
      return;
    }

    if (!data) {
      Alert.alert(
        'Update failed',
        'The incident status could not be updated.'
      );
      setUpdating(false);
      return;
    }

    setIncident(data);

    setUpdating(false);
  }

  async function submitReport() {
    if (!incident) {
      return;
    }

    if (!summary.trim() || !outcome.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter both a report summary and an outcome.'
      );
      return;
    }

    setUpdating(true);

    const { data, error } = await supabase.rpc(
      'submit_incident_report',
      {
        p_incident_id: incident.id,
        p_summary: summary,
        p_outcome: outcome,
      }
    );

    if (error) {
      Alert.alert('Unable to submit report', error.message);
      setUpdating(false);
      return;
    }

    if (!data) {
      Alert.alert(
        'Report failed',
        'The incident report could not be submitted.'
      );
      setUpdating(false);
      return;
    }

    setIncident(data);

    setUpdating(false);

    Alert.alert(
      'Report submitted',
      'The incident has been resolved successfully.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>
          Loading incident...
        </Text>
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>
          Incident could not be found.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Incident Details</Text>

      <View style={styles.card}>
        <Text style={styles.incidentType}>
          {incident.incident_type}
        </Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status</Text>

          <Text style={styles.statusValue}>
            {incident.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        <Text style={styles.label}>Priority</Text>
        <Text style={styles.value}>{incident.priority}</Text>

        <Text style={styles.label}>Caller</Text>
        <Text style={styles.value}>{incident.caller_name}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{incident.caller_phone}</Text>

        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{incident.location}</Text>

        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{incident.description}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Incident Actions
        </Text>

        {incident.status === 'claimed' && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => updateStatus('en_route')}
            disabled={updating}
          >
            <Text style={styles.buttonText}>
              {updating ? 'Updating...' : 'Mark En Route'}
            </Text>
          </TouchableOpacity>
        )}

        {incident.status === 'en_route' && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => updateStatus('on_scene')}
            disabled={updating}
          >
            <Text style={styles.buttonText}>
              {updating ? 'Updating...' : 'Mark On Scene'}
            </Text>
          </TouchableOpacity>
        )}

        {incident.status === 'on_scene' && (
          <>
            <Text style={styles.label}>
              Summary of Actions Taken
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="Describe what happened..."
              value={summary}
              onChangeText={setSummary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Text style={styles.label}>
              Outcome
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="Describe the outcome..."
              value={outcome}
              onChangeText={setOutcome}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={submitReport}
              disabled={updating}
            >
              <Text style={styles.buttonText}>
                {updating
                  ? 'Submitting...'
                  : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {incident.status === 'resolved' && (
          <Text style={styles.resolvedText}>
            This incident has been resolved.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f4f6f8',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f4f6f8',
  },

  loadingText: {
    fontSize: 18,
  },

  backButton: {
    marginTop: 20,
    marginBottom: 20,
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },

  incidentType: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  statusContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 16,
    marginBottom: 16,
  },

  statusLabel: {
    fontSize: 14,
    marginBottom: 4,
  },

  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },

  value: {
    fontSize: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  textArea: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 110,
    backgroundColor: '#ffffff',
  },

  button: {
    backgroundColor: '#222222',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  resolvedText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});