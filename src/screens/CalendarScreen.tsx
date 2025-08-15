import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useOffers } from '../components/OffersContext';
import { Calendar, LocaleConfig } from 'react-native-calendars';

const DARK_BG = '#181A20';
const DARK_HEADER = '#23262F';
const DARK_TEXT = '#fff';
const PRIMARY = '#E31837';

LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  monthNamesShort: [
    'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
  ],
  dayNames: [
    'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
  ],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

type NavigationProp = StackNavigationProp<RootStackParamList>;

function getDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { acceptedOffers, acceptOffer, removeOffer } = useOffers();
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // On suppose que la date de l'offre est dans order.time sous la forme "Aujourd'hui 13:00" ou "Hier 18:00" ou "2024-06-10 13:00"
  // Pour la démo, on va générer des dates fictives sur les 7 prochains jours
  const today = new Date();
  const markedDates: {[date: string]: any} = {};
  const dateToOffer: {[date: string]: any} = {};
  acceptedOffers.forEach((offer) => {
    if (offer.date) {
      markedDates[offer.date] = {
        marked: true,
        dotColor: PRIMARY,
      };
      dateToOffer[offer.date] = offer;
    }
  });

  const handleDayPress = (day: any) => {
    const offer = dateToOffer[day.dateString];
    if (offer) {
      setSelectedOffer(offer);
      setShowModal(true);
    }
  };

  // Fonction pour annuler une réservation (supprimer l'offre du contexte)
  const handleCancel = () => {
    if (selectedOffer) {
      removeOffer(selectedOffer.id);
      setShowModal(false);
      setSelectedOffer(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={26} color={DARK_TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendrier</Text>
      </View>
      <Calendar
        style={{ height: '50%', width: '100%', alignSelf: 'stretch' }}
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          backgroundColor: DARK_BG,
          calendarBackground: DARK_BG,
          textSectionTitleColor: '#fff',
          selectedDayBackgroundColor: PRIMARY,
          selectedDayTextColor: '#fff',
          todayTextColor: PRIMARY,
          dayTextColor: '#fff',
          textDisabledColor: '#444',
          dotColor: PRIMARY,
          arrowColor: PRIMARY,
          monthTextColor: '#fff',
          indicatorColor: PRIMARY,
          textDayFontWeight: '600',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 14,
        }}
      />
      {/* Modal de détail de l'offre */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center'}}>
          <View style={{backgroundColor:DARK_HEADER, borderRadius:18, padding:24, width:'90%', maxWidth:400, alignItems:'stretch'}}>
            {selectedOffer && (
              <>
                <View style={{alignItems:'center', marginBottom:8}}>
                  <MaterialIcons name="event-available" size={40} color={PRIMARY} />
                </View>
                <Text style={{fontSize:22, fontWeight:'700', color:PRIMARY, marginBottom:10, textAlign:'center'}}>Détail de la réservation</Text>
                <View style={{height:1, backgroundColor:'#333', marginBottom:14, opacity:0.2}} />
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:8}}>
                  <MaterialIcons name="person" size={22} color={PRIMARY} style={{marginRight:8}} />
                  <Text style={{color:'#fff', fontWeight:'600', width:90}}>Client :</Text>
                  <Text style={{color:'#fff', flex:1}}>{selectedOffer.client}</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:8}}>
                  <MaterialIcons name="restaurant" size={22} color={PRIMARY} style={{marginRight:8}} />
                  <Text style={{color:'#fff', fontWeight:'600', width:90}}>Restaurant :</Text>
                  <Text style={{color:'#fff', flex:1}}>{selectedOffer.restaurant}</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:8}}>
                  <MaterialIcons name="fastfood" size={22} color={PRIMARY} style={{marginRight:8}} />
                  <Text style={{color:'#fff', fontWeight:'600', width:90}}>Commande :</Text>
                  <Text style={{color:'#fff', flex:1}}>{selectedOffer.details}</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:8}}>
                  <MaterialIcons name="schedule" size={22} color={PRIMARY} style={{marginRight:8}} />
                  <Text style={{color:'#fff', fontWeight:'600', width:90}}>Heure :</Text>
                  <Text style={{color:'#fff', flex:1}}>{selectedOffer.time}</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:8}}>
                  <MaterialIcons name="timer" size={22} color={PRIMARY} style={{marginRight:8}} />
                  <Text style={{color:'#fff', fontWeight:'600', width:90}}>Durée :</Text>
                  <Text style={{color:'#fff', flex:1}}>{selectedOffer.duration}</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:8}}>
                  <MaterialIcons name="place" size={22} color={PRIMARY} style={{marginRight:8}} />
                  <Text style={{color:'#fff', fontWeight:'600', width:90}}>Distance :</Text>
                  <Text style={{color:'#fff', flex:1}}>{selectedOffer.distance}</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:14}}>
                  <MaterialIcons name="euro" size={22} color={PRIMARY} style={{marginRight:8}} />
                  <Text style={{color:'#fff', fontWeight:'600', width:90}}>Gain :</Text>
                  <Text style={{color:PRIMARY, fontWeight:'bold', flex:1}}>{selectedOffer.gain}</Text>
                </View>
                <TouchableOpacity style={{alignSelf:'center', marginTop:8, backgroundColor:PRIMARY, borderRadius:8, paddingHorizontal:32, paddingVertical:12, marginBottom:4}} onPress={()=>setShowModal(false)}>
                  <Text style={{color:'#fff', fontWeight:'700', fontSize:16}}>Fermer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{alignSelf:'center', marginTop:4, backgroundColor:'#EF4444', borderRadius:8, paddingHorizontal:32, paddingVertical:12}} onPress={handleCancel}>
                  <Text style={{color:'#fff', fontWeight:'700', fontSize:16}}>Annuler la réservation</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: DARK_HEADER,
  },
  backBtn: {
    marginRight: 12,
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PRIMARY,
  },
}); 