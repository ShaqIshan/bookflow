import type { CostRate, TemplateId } from "./types";

export interface BusinessTemplate {
  id: TemplateId;
  label: string;
  icon: string;
  services: string[];
  defaultService: string;
  costRates: CostRate[];
}

/**
 * Business-type presets. The booking engine is generic — the shared spine is
 * client · date/time · service · price · deposit · location · status — and
 * templates only tune the vocabulary (services, cost presets) per vertical.
 */
export const TEMPLATES: BusinessTemplate[] = [
  {
    id: "photo-booth",
    label: "Photo Booth & Events",
    icon: "camera",
    services: [
      "Photo Booth",
      "360 Video Booth",
      "Roaming Photographer",
      "Full Day Coverage",
    ],
    defaultService: "Photo Booth",
    costRates: [
      { id: "fuel", label: "Fuel", icon: "local_gas_station", amount: 0.33, unit: "/ km" },
      { id: "workers", label: "Workers", icon: "groups", amount: 80, unit: "/ event" },
      { id: "strips", label: "Strips", icon: "photo_library", amount: 0.3, unit: "/ print" },
    ],
  },
  {
    id: "barber",
    label: "Barber & Salon",
    icon: "content_cut",
    services: ["Haircut", "Haircut + Beard", "Colouring", "Home Visit"],
    defaultService: "Haircut",
    costRates: [
      { id: "products", label: "Products", icon: "soap", amount: 6, unit: "/ visit" },
      { id: "rent", label: "Chair rent", icon: "storefront", amount: 40, unit: "/ day" },
    ],
  },
  {
    id: "aircon",
    label: "Aircon & Home Services",
    icon: "hvac",
    services: ["Service & Cleaning", "Chemical Wash", "Installation", "Repair"],
    defaultService: "Service & Cleaning",
    costRates: [
      { id: "chemicals", label: "Chemicals", icon: "science", amount: 15, unit: "/ job" },
      { id: "fuel", label: "Fuel", icon: "local_gas_station", amount: 0.33, unit: "/ km" },
    ],
  },
  {
    id: "tuition",
    label: "Tuition & Classes",
    icon: "school",
    services: ["1-on-1 Session", "Group Class", "Online Class"],
    defaultService: "1-on-1 Session",
    costRates: [
      { id: "materials", label: "Materials", icon: "menu_book", amount: 3, unit: "/ student" },
      { id: "venue", label: "Venue", icon: "meeting_room", amount: 30, unit: "/ class" },
    ],
  },
  {
    id: "rental",
    label: "Rentals & Equipment",
    icon: "car_rental",
    services: ["Equipment Rental", "Delivery + Setup", "Full Package"],
    defaultService: "Equipment Rental",
    costRates: [
      { id: "transport", label: "Transport", icon: "local_shipping", amount: 0.33, unit: "/ km" },
      { id: "maintenance", label: "Maintenance", icon: "build", amount: 25, unit: "/ rental" },
    ],
  },
  {
    id: "custom",
    label: "Something else",
    icon: "add_circle",
    services: ["Standard Service"],
    defaultService: "Standard Service",
    costRates: [
      { id: "transport", label: "Transport", icon: "local_shipping", amount: 0.33, unit: "/ km" },
      { id: "materials", label: "Materials", icon: "inventory_2", amount: 10, unit: "/ job" },
    ],
  },
];

export function getTemplate(id: TemplateId): BusinessTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
