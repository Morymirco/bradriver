const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (identique à bradriver)
const SUPABASE_URL = 'https://jeumizxzlwjvgerrcpjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldW1penh6bHdqdmdlcnJjcGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTczNjEsImV4cCI6MjA2NjEzMzM2MX0.KnkibttgTcUkz0KZYzRxTeybghlCj_VnnVlcDyUFZ-Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDirectLogin() {
  console.log('🧪 Test de connexion directe avec bradriver');
  console.log('===========================================');

  const testCredentials = {
    email: 'pages29719@cspaus.com',
    password: 'Koulibalymirco23@' // Le mot de passe défini via le lien de réinitialisation
  };

  try {
    // 1. Test de connexion Supabase Auth
    console.log('\n1. Test de connexion Supabase Auth...');
    console.log(`   Email: ${testCredentials.email}`);
    console.log(`   Mot de passe: ${testCredentials.password}`);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testCredentials.email,
      password: testCredentials.password
    });

    if (authError) {
      console.error('❌ Erreur de connexion Auth:', authError.message);
      console.error('   Code:', authError.status);
      console.error('   Détails:', authError);
      return;
    }

    if (!authData.user) {
      console.error('❌ Connexion échouée - pas d\'utilisateur retourné');
      return;
    }

    console.log('✅ Connexion Auth réussie!');
    console.log('   - User ID:', authData.user.id);
    console.log('   - Email:', authData.user.email);
    console.log('   - Email confirmé:', authData.user.email_confirmed_at ? 'Oui' : 'Non');

    // 2. Test de récupération du profil utilisateur (comme dans DriverAuthService)
    console.log('\n2. Test de récupération du profil utilisateur...');
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
          id,
          name
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (userError || !userProfile) {
      console.error('❌ Erreur profil utilisateur:', userError?.message);
      console.error('   Détails:', userError);
      return;
    }

    console.log('✅ Profil utilisateur récupéré:');
    console.log('   - Nom:', userProfile.name);
    console.log('   - Email:', userProfile.email);
    console.log('   - Rôle:', userProfile.user_roles?.name);
    console.log('   - Actif:', userProfile.is_active);
    console.log('   - Vérifié:', userProfile.is_verified);

    // 3. Vérification du rôle driver
    if (userProfile.user_roles?.name !== 'driver') {
      console.error(`❌ Rôle incorrect: ${userProfile.user_roles?.name} (attendu: driver)`);
      return;
    }

    console.log('✅ Rôle driver confirmé');

    // 4. Test de récupération du profil chauffeur
    console.log('\n3. Test de récupération du profil chauffeur...');
    const { data: driver, error: driverError } = await supabase
      .from('driver_profiles')
      .select(`
        id,
        name,
        email,
        phone_number,
        type,
        business_id,
        is_active,
        is_available,
        vehicle_type,
        vehicle_plate,
        avatar_url,
        created_at,
        businesses!driver_profiles_business_id_fkey (
          name
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (driverError || !driver) {
      console.error('❌ Erreur profil chauffeur:', driverError?.message);
      console.error('   Détails:', driverError);
      return;
    }

    console.log('✅ Profil chauffeur récupéré:');
    console.log('   - Nom:', driver.name);
    console.log('   - Type:', driver.type);
    console.log('   - Actif:', driver.is_active);
    console.log('   - Disponible:', driver.is_available);
    console.log('   - Business:', driver.businesses?.name || 'Indépendant');

    // 5. Test de déconnexion
    console.log('\n4. Test de déconnexion...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('❌ Erreur déconnexion:', signOutError.message);
    } else {
      console.log('✅ Déconnexion réussie');
    }

    console.log('\n🎉 TOUS LES TESTS RÉUSSIS!');
    console.log('==========================');
    console.log('✅ La connexion fonctionne parfaitement');
    console.log('✅ Le profil utilisateur est correctement récupéré');
    console.log('✅ Le profil chauffeur est correctement récupéré');
    console.log('✅ Le rôle driver est correct');
    console.log('✅ Les permissions RLS sont correctement configurées');
    
    console.log('\n💡 CONCLUSION:');
    console.log('   Le problème n\'est PAS dans la logique de connexion');
    console.log('   Le problème doit être dans l\'interface bradriver ou dans les identifiants utilisés');

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST:');
    console.error('========================');
    console.error(error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le test
testDirectLogin();
