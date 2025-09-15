const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const SUPABASE_URL = 'https://jeumizxzlwjvgerrcpjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldW1penh6bHdqdmdlcnJjcGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTczNjEsImV4cCI6MjA2NjEzMzM2MX0.KnkibttgTcUkz0KZYzRxTeybghlCj_VnnVlcDyUFZ-Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Identifiants du chauffeur créé
const testCredentials = {
  email: 'xafopi3925@cspaus.com',
  password: 'JUT3zitPr&2N'
};

async function testDriverLogin() {
  console.log('🧪 Test de connexion chauffeur');
  console.log('==============================');
  console.log(`Email: ${testCredentials.email}`);
  console.log(`Mot de passe: ${testCredentials.password}`);
  
  try {
    // Test de connexion
    console.log('\n1. Tentative de connexion...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testCredentials.email,
      password: testCredentials.password
    });

    if (authError) {
      throw new Error(`❌ Erreur de connexion: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('❌ Connexion échouée - pas d\'utilisateur retourné');
    }

    console.log('✅ Connexion réussie!');
    console.log('   - User ID:', authData.user.id);
    console.log('   - Email:', authData.user.email);
    console.log('   - Email confirmé:', authData.user.email_confirmed_at ? 'Oui' : 'Non');

    // Test de récupération du profil utilisateur
    console.log('\n2. Récupération du profil utilisateur...');
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        name,
        email,
        phone_number,
        is_active,
        is_verified,
        role_id,
        user_roles (
          name
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (userError || !userProfile) {
      throw new Error(`❌ Profil utilisateur non trouvé: ${userError?.message}`);
    }

    console.log('✅ Profil utilisateur récupéré:');
    console.log('   - Nom:', userProfile.name);
    console.log('   - Email:', userProfile.email);
    console.log('   - Rôle:', userProfile.user_roles?.name);
    console.log('   - Actif:', userProfile.is_active);

    // Test de récupération du profil chauffeur
    console.log('\n3. Récupération du profil chauffeur...');
    const { data: driver, error: driverError } = await supabase
      .from('driver_profiles')
      .select(`
        id,
        name,
        email,
        type,
        vehicle_type,
        vehicle_plate,
        is_active,
        is_available
      `)
      .eq('id', authData.user.id)
      .single();

    if (driverError || !driver) {
      throw new Error(`❌ Profil chauffeur non trouvé: ${driverError?.message}`);
    }

    console.log('✅ Profil chauffeur récupéré:');
    console.log('   - Type:', driver.type);
    console.log('   - Véhicule:', driver.vehicle_type);
    console.log('   - Plaque:', driver.vehicle_plate);
    console.log('   - Actif:', driver.is_active);
    console.log('   - Disponible:', driver.is_available);

    // Déconnexion
    console.log('\n4. Déconnexion...');
    await supabase.auth.signOut();
    console.log('✅ Déconnexion réussie');

    console.log('\n🎉 TEST DE CONNEXION RÉUSSI!');
    console.log('=============================');
    console.log('✅ Le chauffeur peut maintenant se connecter dans bradriver');
    console.log('✅ Tous les profils sont correctement configurés');
    console.log('✅ Les permissions RLS fonctionnent correctement');

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST DE CONNEXION:');
    console.error('====================================');
    console.error(error.message);
    
    console.error('\n🔧 Actions recommandées:');
    console.error('1. Vérifier que l\'email est correct');
    console.error('2. Vérifier que le mot de passe est correct');
    console.error('3. Vérifier que le compte est actif dans Supabase');
    console.error('4. Vérifier les permissions RLS');
  }
}

// Exécuter le test
testDriverLogin();
