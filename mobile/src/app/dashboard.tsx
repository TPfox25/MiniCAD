import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { registerForPushNotifications } from '@/lib/notification';

type Incident = {
  id: number;
  caller_name: string;
  location: string;
  incident_type: string;
  priority: string;
  description: string;
  status: string;
  claimed_by?: string | null;
};

export default function DashboardScreen() {
  const router = useRouter();

  const [onDuty, setOnDuty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    loadOfficerStatus();
    loadIncidents();

    const profileChannel = supabase
      .channel('officer-profile')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        async (payload) => {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user && payload.new.id === user.id) {
            setOnDuty(payload.new.on_duty);
          }
        }
      )
      .subscribe();

    const incidentChannel = supabase
      .channel('officer-incidents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
        },
        () => {
          loadIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(incidentChannel);
    };
  }, []);

  async function loadOfficerStatus() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Error', 'Unable to find the logged-in officer.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('on_duty')
      .eq('id', user.id)
      .single();

    if (profileError) {
      Alert.alert('Error', profileError.message);
      setLoading(false);
      return;
    }

    setOnDuty(profile.on_duty);
    setLoading(false);
  }

  async function loadIncidents() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return;
    }

    const { data, error } = await supabase
      .from('incidents')
      .select(
        'id, caller_name, location, incident_type, priority, description, status, claimed_by'
      )
      .or(`status.eq.dispatched,claimed_by.eq.${user.id}`)
      .neq('status', 'resolved')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setIncidents(data ?? []);
  }

  async function toggleDutyStatus() {
    setUpdating(true);

    const newStatus = !onDuty;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Error', 'Unable to find the logged-in officer.');
      setUpdating(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        on_duty: newStatus,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
      setUpdating(false);
      return;
    }

    setOnDuty(newStatus);

    if (newStatus) {
     await registerForPushNotifications();
    }

    setUpdating(false);
  }

  async function claimIncident(incidentId: number) {
    const { data, error } = await supabase.rpc('claim_incident', {
      p_incident_id: incidentId,
    });

    if (error) {
      Alert.alert('Unable to claim incident', error.message);
      return;
    }

    if (!data) {
      Alert.alert(
        'Incident unavailable',
        'This incident has already been claimed.'
      );
      return;
    }

    await loadIncidents();

    router.push({
      pathname: '/incident/[id]',
      params: {
        id: String(incidentId),
      },
    });
  }

  function openIncident(incidentId: number) {
    router.push({
      pathname: '/incident/[id]',
      params: {
        id: String(incidentId),
      },
    });
  }

  const activeIncidents = incidents.filter(
    (incident) => incident.claimed_by !== null && incident.claimed_by !== undefined
  );

  const openIncidents = incidents.filter(
    (incident) =>
      incident.status === 'dispatched' &&
      (incident.claimed_by === null || incident.claimed_by === undefined)
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>MiniCAD</Text>

      <Text style={styles.subtitle}>Officer Dashboard</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Duty Status</Text>

        {loading ? (
          <Text style={styles.statusText}>Loading...</Text>
        ) : (
          <>
            <Text style={styles.statusText}>
              {onDuty ? 'On Duty' : 'Off Duty'}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={toggleDutyStatus}
              disabled={updating}
            >
              <Text style={styles.buttonText}>
                {updating
                  ? 'Updating...'
                  : onDuty
                    ? 'Go Off Duty'
                    : 'Go On Duty'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {activeIncidents.length > 0 && (
        <View style={styles.incidentCard}>
          <Text style={styles.cardTitle}>My Active Incidents</Text>

          {activeIncidents.map((incident) => (
            <View key={incident.id} style={styles.incident}>
              <Text style={styles.incidentType}>
                {incident.incident_type}
              </Text>

              <Text style={styles.incidentInfo}>
                Priority: {incident.priority}
              </Text>

              <Text style={styles.incidentInfo}>
                Location: {incident.location}
              </Text>

              <Text style={styles.incidentInfo}>
                Caller: {incident.caller_name}
              </Text>

              <Text style={styles.incidentInfo}>
                Status:{' '}
                {incident.status.replace('_', ' ').toUpperCase()}
              </Text>

              <Text style={styles.incidentDescription}>
                {incident.description}
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => openIncident(incident.id)}
              >
                <Text style={styles.claimButtonText}>
                  Update Status
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.incidentCard}>
        <Text style={styles.cardTitle}>Open Incidents</Text>

        {openIncidents.length === 0 ? (
          <Text style={styles.cardText}>
            No unclaimed incidents available.
          </Text>
        ) : (
          openIncidents.map((incident) => (
            <View key={incident.id} style={styles.incident}>
              <Text style={styles.incidentType}>
                {incident.incident_type}
              </Text>

              <Text style={styles.incidentInfo}>
                Priority: {incident.priority}
              </Text>

              <Text style={styles.incidentInfo}>
                Location: {incident.location}
              </Text>

              <Text style={styles.incidentInfo}>
                Caller: {incident.caller_name}
              </Text>

              <Text style={styles.incidentInfo}>
                Status: DISPATCHED
              </Text>

              <Text style={styles.incidentDescription}>
                {incident.description}
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => claimIncident(incident.id)}
              >
                <Text style={styles.claimButtonText}>
                  Claim Incident
                </Text>
              </TouchableOpacity>
            </View>
          ))
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

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 40,
  },

  subtitle: {
    fontSize: 20,
    marginTop: 4,
    marginBottom: 30,
  },

  statusCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },

  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  statusText: {
    fontSize: 16,
    marginBottom: 16,
  },

  button: {
    backgroundColor: '#222222',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  incidentCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  cardText: {
    fontSize: 16,
  },

  incident: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },

  incidentType: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  incidentInfo: {
    fontSize: 15,
    marginBottom: 4,
  },

  incidentDescription: {
    fontSize: 15,
    marginTop: 8,
  },

  claimButton: {
    backgroundColor: '#222222',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },

  claimButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});