export interface SampleMessage {
  role: "agent" | "caller";
  text: string;
}

export const sampleConversations: Record<string, SampleMessage[]> = {
  dental: [
    {
      role: "agent",
      text: "Thank you for calling Sunrise Medical Clinic. This is Sarah, your virtual assistant. How may I help you?",
    },
    {
      role: "caller",
      text: "Hi, I'd like to schedule a cleaning appointment.",
    },
    {
      role: "agent",
      text: "Of course! Are you an existing patient, or is this your first visit with us?",
    },
    {
      role: "caller",
      text: "I'm an existing patient.",
    },
    {
      role: "agent",
      text: "Great! I can see your file. Dr. Chen has availability this Thursday at 2 PM or Friday at 10 AM. Which works better?",
    },
  ],
  salon: [
    {
      role: "agent",
      text: "Welcome to Luxe Salon! I'm Mia. How can I help you today?",
    },
    {
      role: "caller",
      text: "I need a haircut and color this Saturday.",
    },
    {
      role: "agent",
      text: "Let me check our stylists. Jessica has a 10 AM slot open, and Marcus is free at 1 PM. Shall I book one?",
    },
  ],
  hvac: [
    {
      role: "agent",
      text: "QuickFlow Plumbing, this is Alex. Is this an emergency or would you like to schedule service?",
    },
    {
      role: "caller",
      text: "My basement is flooding! I need someone NOW.",
    },
    {
      role: "agent",
      text: "I understand the urgency. I'm dispatching our nearest technician immediately. Can you confirm your address?",
    },
  ],
  restaurant: [
    {
      role: "agent",
      text: "Bella Cucina, how can I help you tonight?",
    },
    {
      role: "caller",
      text: "Can I get a table for 4 this Friday at 7?",
    },
    {
      role: "agent",
      text: "Let me check... We have a lovely window table at 7:15 PM. Shall I reserve it for you?",
    },
  ],
  realestate: [
    {
      role: "agent",
      text: "Welcome to Pinnacle Realty! I'm here to help. Are you looking to buy, sell, or rent?",
    },
    {
      role: "caller",
      text: "I saw the listing on 45 Oak Street and want to schedule a showing.",
    },
    {
      role: "agent",
      text: "Great choice! That property has been getting a lot of interest. I have slots available tomorrow at 2 PM and Saturday at 11 AM.",
    },
  ],
  legal: [
    {
      role: "agent",
      text: "Thank you for calling Morrison & Associates. How can we assist you?",
    },
    {
      role: "caller",
      text: "I was in a car accident last week and need a lawyer.",
    },
    {
      role: "agent",
      text: "I'm sorry to hear that. Let me gather some information and schedule a free consultation with one of our personal injury attorneys.",
    },
  ],
  gym: [
    {
      role: "agent",
      text: "FitLife Gym, this is Max! How can I help you get started?",
    },
    {
      role: "caller",
      text: "What classes do you have tomorrow morning?",
    },
    {
      role: "agent",
      text: "Tomorrow we have Yoga Flow at 7 AM, Spin at 8:30, and HIIT at 9:15. Want me to reserve a spot?",
    },
  ],
  vet: [
    {
      role: "agent",
      text: "Happy Paws Veterinary, this is Dr. Paws' assistant. How can I help?",
    },
    {
      role: "caller",
      text: "My dog ate chocolate. Is that bad?",
    },
    {
      role: "agent",
      text: "That can be serious. How much did your dog eat and what's their weight? I'll help determine if you need to come in immediately.",
    },
  ],
  autorepair: [
    {
      role: "agent",
      text: "Precision Auto, this is Casey. What can we help you with?",
    },
    {
      role: "caller",
      text: "My check engine light came on. Can I bring it in today?",
    },
    {
      role: "agent",
      text: "Absolutely. We have a bay opening at 3 PM today. What's the year, make, and model of your vehicle?",
    },
  ],
  insurance: [
    {
      role: "agent",
      text: "SafeGuard Insurance, this is Riley. How may I help you?",
    },
    {
      role: "caller",
      text: "I need to add a new car to my auto policy.",
    },
    {
      role: "agent",
      text: "I can help with that. What's the vehicle year, make, and model? I'll also need the VIN to get you an accurate quote.",
    },
  ],
  education: [
    {
      role: "agent",
      text: "BrightMinds Learning Center, how can I help you today?",
    },
    {
      role: "caller",
      text: "My daughter needs help with SAT prep. What programs do you offer?",
    },
    {
      role: "agent",
      text: "We have a 12-week SAT prep course starting next Monday, as well as 1-on-1 tutoring. Would you like details on pricing and schedules?",
    },
  ],
  logistics: [
    {
      role: "agent",
      text: "SwiftCourier, this is Dispatch AI. How can I help?",
    },
    {
      role: "caller",
      text: "Where's my package? Tracking number SW-99812.",
    },
    {
      role: "agent",
      text: "Let me check... Your package is currently out for delivery and estimated to arrive between 2-4 PM today.",
    },
  ],
};
