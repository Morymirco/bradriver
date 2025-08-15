import React, { createContext, useContext, useState } from 'react';

export type Offer = {
  id: string;
  restaurant: string;
  status: string;
  assignedBy: string;
  time: string;
  details: string;
  client: string;
  duration: string;
  gain: string;
  distance: string;
  date?: string; // format YYYY-MM-DD
};

type OffersContextType = {
  acceptedOffers: Offer[];
  acceptOffer: (offer: Offer) => void;
  removeOffer: (id: string) => void;
};

const OffersContext = createContext<OffersContextType | undefined>(undefined);

function extractDateFromTime(time: string): string | undefined {
  // Exemples : '2024-06-12 13:00', 'Aujourd\'hui 13:00', 'Hier 18:00'
  if (/\d{4}-\d{2}-\d{2}/.test(time)) {
    return time.split(' ')[0];
  }
  const today = new Date();
  if (time.startsWith("Aujourd'hui")) {
    return today.toISOString().split('T')[0];
  }
  if (time.startsWith('Hier')) {
    const d = new Date(today);
    d.setDate(today.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  // Sinon, retourne undefined
  return undefined;
}

export const OffersProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [acceptedOffers, setAcceptedOffers] = useState<Offer[]>([]);

  const acceptOffer = (offer: Offer) => {
    let date = offer.date;
    if (!date) {
      date = extractDateFromTime(offer.time);
    }
    const offerWithDate = { ...offer, date };
    setAcceptedOffers(prev => prev.some(o => o.id === offer.id) ? prev : [...prev, offerWithDate]);
  };

  const removeOffer = (id: string) => {
    setAcceptedOffers(prev => prev.filter(o => o.id !== id));
  };

  return (
    <OffersContext.Provider value={{ acceptedOffers, acceptOffer, removeOffer }}>
      {children}
    </OffersContext.Provider>
  );
};

export const useOffers = () => {
  const ctx = useContext(OffersContext);
  if (!ctx) throw new Error('useOffers must be used within an OffersProvider');
  return ctx;
}; 