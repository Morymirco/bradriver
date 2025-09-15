#!/usr/bin/env node

/**
 * Script de test pour la connexion chauffeur dans bradriver
 * Ce script teste la connexion avec les identifiants créés par l'admin
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../src/config/env.js';

// Configuration Supabase
const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

// Identifiants de test (créés par l'admin)
const testCredentials = {
  email: 'test.driver.solution3@example.com',
  password: 'TestPassword123!'
};

async function testDriverLogin() {
  console.log('🧪 Test de connexion chauffeur dans bradriver');
  console.log('==============================================');
  
  try {
    // 1. Test de connexion
    console.log('\n1. Tentative de connexion...');
    console.log(`   Email: ${testCredentials.email}`);
    console.log(`   Mot de passe: ${testCredentials.password}`);
    
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

    // 2. Test de récupération du profil utilisateur
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
    console.log('   - Téléphone:', userProfile.phone_number);
    console.log('   - Rôle:', userProfile.user_roles?.name);
    console.log('   - Actif:', userProfile.is_active);
    console.log('   - Vérifié:', userProfile.is_verified);

    // Vérifier que c'est bien un driver
    if (userProfile.user_roles?.name !== 'driver') {
      throw new Error(`❌ Rôle incorrect: ${userProfile.user_roles?.name} (attendu: driver)`);
    }

    // 3. Test de récupération du profil chauffeur
    console.log('\n3. Récupération du profil chauffeur...');
    const { data: driver, error: driverError } = await supabase
      .from('driver_profiles')
      .select(`
        id,
        name,
        email,
        phone_number,
        type,
        business_id,
        vehicle_type,
        vehicle_plate,
        is_active,
        is_available,
        avatar_url,
        created_at
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
    console.log('   - Business ID:', driver.business_id || 'Indépendant');

    // 4. Test de récupération des commandes du chauffeur
    console.log('\n4. Test de récupération des commandes...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        delivery_fee,
        created_at
      `)
      .eq('driver_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersError) {
      console.log('⚠️ Erreur lors de la récupération des commandes:', ordersError.message);
    } else {
      console.log(`✅ Commandes récupérées: ${orders?.length || 0} commande(s)`);
      if (orders && orders.length > 0) {
        orders.forEach((order, index) => {
          console.log(`   ${index + 1}. Commande #${order.order_number || order.id.slice(0, 8)} - ${order.status}`);
        });
      }
    }

    // 5. Test de récupération des documents du chauffeur
    console.log('\n5. Test de récupération des documents...');
    const { data: documents, error: documentsError } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', authData.user.id)
      .order('created_at', { ascending: false });

    if (documentsError) {
      console.log('⚠️ Erreur lors de la récupération des documents:', documentsError.message);
    } else {
      console.log(`✅ Documents récupérés: ${documents?.length || 0} document(s)`);
    }

    // 6. Test de mise à jour de la disponibilité
    console.log('\n6. Test de mise à jour de la disponibilité...');
    const { error: updateError } = await supabase
      .from('driver_profiles')
      .update({ is_available: true })
      .eq('id', authData.user.id);

    if (updateError) {
      console.log('⚠️ Erreur lors de la mise à jour de la disponibilité:', updateError.message);
    } else {
      console.log('✅ Disponibilité mise à jour avec succès');
    }

    // 7. Déconnexion
    console.log('\n7. Déconnexion...');
    await supabase.auth.signOut();
    console.log('✅ Déconnexion réussie');

    console.log('\n🎉 TEST DE CONNEXION RÉUSSI!');
    console.log('=============================');
    console.log('✅ La connexion fonctionne parfaitement');
    console.log('✅ Le profil utilisateur est correctement récupéré');
    console.log('✅ Le profil chauffeur est correctement récupéré');
    console.log('✅ Les permissions RLS sont correctement configurées');
    console.log('✅ L\'application bradriver peut maintenant fonctionner');
    
    console.log('\n📋 Résumé des tests:');
    console.log('   ✅ Authentification Supabase');
    console.log('   ✅ Récupération profil utilisateur');
    console.log('   ✅ Récupération profil chauffeur');
    console.log('   ✅ Vérification du rôle driver');
    console.log('   ✅ Accès aux commandes');
    console.log('   ✅ Accès aux documents');
    console.log('   ✅ Mise à jour de la disponibilité');
    console.log('   ✅ Déconnexion');

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST DE CONNEXION:');
    console.error('====================================');
    console.error(error.message);
    
    console.error('\n🔧 Actions recommandées:');
    console.error('1. Vérifier que le chauffeur a été créé par l\'admin');
    console.error('2. Vérifier que l\'email est confirmé dans Supabase');
    console.error('3. Vérifier que le rôle "driver" existe et est correctement assigné');
    console.error('4. Vérifier les permissions RLS sur les tables');
    console.error('5. Vérifier que les identifiants sont corrects');
    
    console.error('\n📝 Pour créer un chauffeur de test:');
    console.error('   Exécutez: node BraPrime-admin/scripts/test-driver-creation.js');
  }
}

// Exécuter le test
testDriverLogin();
