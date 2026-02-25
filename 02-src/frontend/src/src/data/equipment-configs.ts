/**
 * Equipment category configurations for the DiagnosticPro multi-equipment diagnostic platform.
 *
 * Each category defines:
 * - Type-specific form fields rendered below the shared base fields
 * - Category-relevant symptom checkboxes
 * - UI copy hints (error code placeholder, identifier label, usage metric label)
 * - Location environment options
 *
 * @module data/equipment-configs
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface FieldOption {
  value: string;
  label: string;
}

export interface EquipmentField {
  /** Unique field identifier used as form key and HTML id. */
  id: string;
  /** Human-readable label rendered above the control. */
  label: string;
  /** Rendered control type. */
  type: "select" | "text" | "checkbox";
  /** Required when type is "select". */
  options?: FieldOption[];
  /** Placeholder text for text inputs or select controls. */
  placeholder?: string;
}

export interface EquipmentConfig {
  /** Stable category identifier (matches key in EQUIPMENT_CONFIGS). */
  id: string;
  /** Display label shown in category selector and page headings. */
  displayName: string;
  /** Type-specific fields rendered after the shared base fields. */
  fields: EquipmentField[];
  /** Symptom strings rendered as checkboxes in the symptom picker. */
  symptoms: string[];
  /**
   * Placeholder text for the generic "error code" input, tailored to the
   * terminology used in that equipment category (DTC, J1939 SPN, fault code, etc.).
   */
  errorCodeHint: string;
  /**
   * Label for the equipment identifier field.
   * Examples: "VIN", "HIN", "Serial Number", "IMEI".
   */
  identifierLabel: string;
  /**
   * Label for the primary usage metric.
   * Examples: "Mileage", "Engine Hours", "Age (years)".
   */
  usageMetricLabel: string;
  /** Placeholder text for the usage metric input. */
  usageMetricPlaceholder: string;
  /** Location/environment options specific to this category. */
  locationOptions: FieldOption[];
}

// ---------------------------------------------------------------------------
// Category configurations
// ---------------------------------------------------------------------------

export const EQUIPMENT_CONFIGS: Record<string, EquipmentConfig> = {
  // -------------------------------------------------------------------------
  // 1. Automotive — Cars & SUVs
  // -------------------------------------------------------------------------
  automotive: {
    id: "automotive",
    displayName: "Cars & SUVs",
    fields: [
      {
        id: "fuelType",
        label: "Fuel Type",
        type: "select",
        options: [
          { value: "gas", label: "Gasoline" },
          { value: "diesel", label: "Diesel" },
          { value: "hybrid", label: "Hybrid" },
          { value: "electric", label: "Electric" },
          { value: "flex-fuel", label: "Flex Fuel (E85)" },
        ],
      },
      {
        id: "transmission",
        label: "Transmission",
        type: "select",
        options: [
          { value: "automatic", label: "Automatic" },
          { value: "manual", label: "Manual" },
          { value: "cvt", label: "CVT" },
          { value: "dct", label: "DCT (Dual-Clutch)" },
        ],
      },
      {
        id: "drivetrain",
        label: "Drivetrain",
        type: "select",
        options: [
          { value: "fwd", label: "FWD (Front-Wheel Drive)" },
          { value: "rwd", label: "RWD (Rear-Wheel Drive)" },
          { value: "awd", label: "AWD (All-Wheel Drive)" },
          { value: "4wd", label: "4WD / 4x4" },
        ],
      },
      {
        id: "checkEngineLightOn",
        label: "Check Engine Light On?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
    ],
    symptoms: [
      "Won't start",
      "Rough idle",
      "Check engine light",
      "Strange noises",
      "Overheating",
      "Power loss",
      "Transmission issues",
      "Brake problems",
      "Electrical issues",
      "Fluid leak",
    ],
    errorCodeHint: "e.g. P0300, P0420, B1234",
    identifierLabel: "VIN",
    usageMetricLabel: "Mileage",
    usageMetricPlaceholder: "e.g. 87,500",
    locationOptions: [
      { value: "city", label: "City / Urban" },
      { value: "highway", label: "Highway" },
      { value: "rural", label: "Rural Roads" },
      { value: "off-road", label: "Off-Road" },
      { value: "parking-lot", label: "Parking Lot" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 2. Gas Trucks
  // -------------------------------------------------------------------------
  "gas-trucks": {
    id: "gas-trucks",
    displayName: "Gas Trucks",
    fields: [
      {
        id: "fuelType",
        label: "Fuel Type",
        type: "select",
        options: [
          { value: "gas", label: "Gasoline" },
          { value: "flex-fuel", label: "Flex Fuel (E85)" },
        ],
      },
      {
        id: "transmission",
        label: "Transmission",
        type: "select",
        options: [
          { value: "automatic", label: "Automatic" },
          { value: "manual", label: "Manual" },
          { value: "cvt", label: "CVT" },
          { value: "dct", label: "DCT (Dual-Clutch)" },
        ],
      },
      {
        id: "drivetrain",
        label: "Drivetrain",
        type: "select",
        options: [
          { value: "rwd", label: "RWD (Rear-Wheel Drive)" },
          { value: "4wd", label: "4WD / 4x4" },
          { value: "awd", label: "AWD (All-Wheel Drive)" },
        ],
      },
      {
        id: "checkEngineLightOn",
        label: "Check Engine Light On?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "towingContext",
        label: "Problem Occurs While Towing?",
        type: "select",
        options: [
          { value: "yes", label: "Yes — problem occurs while towing" },
          { value: "no", label: "No — problem occurs without a load" },
          { value: "both", label: "Both towing and unloaded" },
          { value: "na", label: "Not applicable" },
        ],
      },
    ],
    symptoms: [
      "Won't start",
      "Rough idle",
      "Check engine light",
      "Strange noises",
      "Overheating",
      "Power loss",
      "Transmission issues",
      "Brake problems",
      "Electrical issues",
      "Fluid leak",
    ],
    errorCodeHint: "e.g. P0300, P0420, B1234",
    identifierLabel: "VIN",
    usageMetricLabel: "Mileage",
    usageMetricPlaceholder: "e.g. 112,000",
    locationOptions: [
      { value: "city", label: "City / Urban" },
      { value: "highway", label: "Highway" },
      { value: "rural", label: "Rural Roads" },
      { value: "off-road", label: "Off-Road" },
      { value: "parking-lot", label: "Parking Lot" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 3. Diesel Trucks
  // -------------------------------------------------------------------------
  "diesel-trucks": {
    id: "diesel-trucks",
    displayName: "Diesel Trucks",
    fields: [
      {
        id: "defSystemStatus",
        label: "DEF System Status",
        type: "select",
        options: [
          { value: "normal", label: "Normal — no warnings" },
          { value: "warning-light", label: "Warning light on" },
          { value: "low-level", label: "Low DEF level" },
          { value: "system-fault", label: "System fault / derate active" },
        ],
      },
      {
        id: "dpfRegenIssues",
        label: "DPF Regeneration Issues?",
        type: "select",
        options: [
          { value: "yes", label: "Yes — regen problems present" },
          { value: "no", label: "No — regen operating normally" },
        ],
      },
      {
        id: "turboType",
        label: "Turbocharger Type",
        type: "select",
        options: [
          { value: "single", label: "Single turbo" },
          { value: "twin", label: "Twin turbo" },
          { value: "vgt", label: "Variable geometry (VGT)" },
          { value: "none", label: "None / N/A" },
        ],
      },
      {
        id: "drivetrain",
        label: "Drivetrain",
        type: "select",
        options: [
          { value: "rwd", label: "RWD (Rear-Wheel Drive)" },
          { value: "4wd", label: "4WD / 4x4" },
          { value: "awd", label: "AWD (All-Wheel Drive)" },
        ],
      },
      {
        id: "checkEngineLightOn",
        label: "Check Engine Light On?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
    ],
    symptoms: [
      "Won't start",
      "Rough idle",
      "Check engine light",
      "Strange noises",
      "Overheating",
      "Power loss",
      "Transmission issues",
      "Brake problems",
      "Electrical issues",
      "Fluid leak",
    ],
    errorCodeHint: "e.g. P2002, P20EE, U0001",
    identifierLabel: "VIN",
    usageMetricLabel: "Mileage",
    usageMetricPlaceholder: "e.g. 198,000",
    locationOptions: [
      { value: "city", label: "City / Urban" },
      { value: "highway", label: "Highway" },
      { value: "rural", label: "Rural Roads" },
      { value: "off-road", label: "Off-Road" },
      { value: "parking-lot", label: "Parking Lot" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 4. Semi Trucks / Class 8
  // -------------------------------------------------------------------------
  "semi-trucks": {
    id: "semi-trucks",
    displayName: "Semi Trucks / Class 8",
    fields: [
      {
        id: "engineMake",
        label: "Engine Make",
        type: "select",
        options: [
          { value: "cummins", label: "Cummins" },
          { value: "detroit", label: "Detroit Diesel" },
          { value: "paccar-mx", label: "PACCAR (MX series)" },
          { value: "volvo", label: "Volvo" },
          { value: "navistar", label: "Navistar / International" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "dotNumber",
        label: "DOT Number (optional)",
        type: "text",
        placeholder: "e.g. US DOT 1234567",
      },
      {
        id: "engineBrakeType",
        label: "Engine Brake Type",
        type: "select",
        options: [
          { value: "jake-brake", label: "Jake Brake (compression release)" },
          { value: "exhaust-brake", label: "Exhaust Brake" },
          { value: "none", label: "None" },
          { value: "unknown", label: "Unknown" },
        ],
      },
      {
        id: "eldEcmFaultCodes",
        label: "ELD / ECM Fault Codes",
        type: "text",
        placeholder: "e.g. SPN 3031 FMI 18 (J1939 format)",
      },
    ],
    symptoms: [
      "Won't start",
      "Loss of power",
      "Check engine light",
      "Aftertreatment warning",
      "Air brake issues",
      "Electrical faults",
      "Coolant leak",
      "Oil pressure warning",
      "Transmission problems",
      "DPF regeneration issues",
    ],
    errorCodeHint: "e.g. SPN 3031 FMI 18, SPN 102 FMI 1",
    identifierLabel: "VIN",
    usageMetricLabel: "Engine Hours / Mileage",
    usageMetricPlaceholder: "e.g. 850,000 mi or 22,000 hrs",
    locationOptions: [
      { value: "highway", label: "Highway / Interstate" },
      { value: "city-delivery", label: "City Delivery" },
      { value: "distribution-center", label: "Distribution Center" },
      { value: "truck-stop", label: "Truck Stop" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 5. Motorcycles
  // -------------------------------------------------------------------------
  motorcycles: {
    id: "motorcycles",
    displayName: "Motorcycles",
    fields: [
      {
        id: "engineConfiguration",
        label: "Engine Configuration",
        type: "select",
        options: [
          { value: "single", label: "Single cylinder" },
          { value: "v-twin", label: "V-Twin" },
          { value: "parallel-twin", label: "Parallel Twin" },
          { value: "inline-3", label: "Inline-3" },
          { value: "inline-4", label: "Inline-4" },
          { value: "v4", label: "V4" },
          { value: "flat-twin", label: "Flat Twin (Boxer)" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "driveType",
        label: "Final Drive Type",
        type: "select",
        options: [
          { value: "chain", label: "Chain drive" },
          { value: "belt", label: "Belt drive" },
          { value: "shaft", label: "Shaft drive" },
        ],
      },
      {
        id: "absEquipped",
        label: "ABS Equipped?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unknown", label: "Unknown" },
        ],
      },
    ],
    symptoms: [
      "Won't start",
      "Rough idle",
      "Stalling",
      "Strange noises",
      "Overheating",
      "Power loss",
      "Electrical issues",
      "Brake problems",
      "Clutch issues",
      "Fuel system problems",
    ],
    errorCodeHint: "e.g. C0044, U0101 or manufacturer fault code",
    identifierLabel: "VIN",
    usageMetricLabel: "Mileage",
    usageMetricPlaceholder: "e.g. 24,500",
    locationOptions: [
      { value: "city", label: "City / Urban" },
      { value: "highway", label: "Highway" },
      { value: "rural", label: "Rural Roads" },
      { value: "off-road", label: "Off-Road" },
      { value: "parking-lot", label: "Parking Lot" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 6. ATVs / UTVs / Side-by-Sides
  // -------------------------------------------------------------------------
  "atvs-utvs": {
    id: "atvs-utvs",
    displayName: "ATVs / UTVs / Side-by-Sides",
    fields: [
      {
        id: "driveMode",
        label: "Drive Mode",
        type: "select",
        options: [
          { value: "2wd", label: "2WD" },
          { value: "4wd", label: "4WD" },
          { value: "diff-lock", label: "Differential lock" },
          { value: "awd", label: "AWD (auto)" },
        ],
      },
      {
        id: "accessories",
        label: "Accessories Installed",
        type: "select",
        options: [
          { value: "winch", label: "Winch" },
          { value: "plow", label: "Plow" },
          { value: "cab-enclosure", label: "Cab Enclosure" },
          { value: "light-bar", label: "Light Bar" },
          { value: "none", label: "None" },
        ],
      },
    ],
    symptoms: [
      "Won't start",
      "Overheating",
      "Won't shift",
      "4WD not engaging",
      "Belt squealing / slipping",
      "Power loss",
      "Electrical issues",
      "Steering problems",
      "Suspension noise",
      "Fluid leak",
    ],
    errorCodeHint: "e.g. manufacturer fault code or DTC",
    identifierLabel: "Serial Number",
    usageMetricLabel: "Engine Hours",
    usageMetricPlaceholder: "e.g. 340 hrs",
    locationOptions: [
      { value: "trail", label: "Trail" },
      { value: "farm-ranch", label: "Farm / Ranch" },
      { value: "sand-dunes", label: "Sand Dunes" },
      { value: "mud", label: "Mud" },
      { value: "snow", label: "Snow" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 7. RVs & Motorhomes
  // -------------------------------------------------------------------------
  rvs: {
    id: "rvs",
    displayName: "RVs & Motorhomes",
    fields: [
      {
        id: "rvClass",
        label: "RV Class / Type",
        type: "select",
        options: [
          { value: "class-a", label: "Class A (motorhome)" },
          { value: "class-b", label: "Class B (camper van)" },
          { value: "class-c", label: "Class C (motorhome)" },
          { value: "5th-wheel", label: "5th Wheel (trailer)" },
          { value: "travel-trailer", label: "Travel Trailer" },
          { value: "toy-hauler", label: "Toy Hauler" },
          { value: "pop-up", label: "Pop-Up Camper" },
        ],
      },
      {
        id: "chassisMake",
        label: "Chassis Make (if motorhome)",
        type: "text",
        placeholder: "e.g. Ford F-53, Freightliner XC, Spartan",
      },
      {
        id: "generatorMakeModel",
        label: "Generator Make / Model",
        type: "text",
        placeholder: "e.g. Onan 5500, Cummins Quiet Diesel",
      },
      {
        id: "generatorHours",
        label: "Generator Hours",
        type: "text",
        placeholder: "e.g. 1,200 hrs",
      },
      {
        id: "problemArea",
        label: "Primary Problem Area",
        type: "select",
        options: [
          { value: "chassis-drivetrain", label: "Chassis / Drivetrain" },
          { value: "house-coach", label: "House / Coach Systems" },
          { value: "generator", label: "Generator" },
          { value: "both-unsure", label: "Both / Not sure" },
        ],
      },
    ],
    symptoms: [
      "Engine won't start",
      "Generator won't start",
      "AC not cooling",
      "Water heater failure",
      "Slide-out malfunction",
      "Electrical issues",
      "Water leak",
      "Propane system issue",
      "Leveling jack problem",
      "Refrigerator not cooling",
    ],
    errorCodeHint: "e.g. Onan fault code, chassis DTC (P0xxx)",
    identifierLabel: "VIN",
    usageMetricLabel: "Mileage",
    usageMetricPlaceholder: "e.g. 55,000",
    locationOptions: [
      { value: "campground", label: "Campground" },
      { value: "highway", label: "Highway" },
      { value: "driveway-storage", label: "Driveway / Storage" },
      { value: "rv-park", label: "RV Park" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 8. Marine / Boats
  // -------------------------------------------------------------------------
  marine: {
    id: "marine",
    displayName: "Marine / Boats",
    fields: [
      {
        id: "engineMounting",
        label: "Engine Mounting",
        type: "select",
        options: [
          { value: "outboard", label: "Outboard" },
          { value: "inboard", label: "Inboard" },
          { value: "sterndrive", label: "Sterndrive (I/O)" },
          { value: "jet-drive", label: "Jet Drive" },
        ],
      },
      {
        id: "fuelType",
        label: "Fuel Type",
        type: "select",
        options: [
          { value: "gas", label: "Gasoline" },
          { value: "diesel", label: "Diesel" },
        ],
      },
      {
        id: "waterType",
        label: "Water Type",
        type: "select",
        options: [
          { value: "salt-water", label: "Salt Water" },
          { value: "fresh-water", label: "Fresh Water" },
          { value: "both-brackish", label: "Both / Brackish" },
        ],
      },
      {
        id: "winterizationStatus",
        label: "Winterization Status",
        type: "select",
        options: [
          { value: "winterized", label: "Currently winterized" },
          { value: "not-winterized", label: "Not winterized" },
          { value: "recently-de-winterized", label: "Recently de-winterized" },
          { value: "na", label: "N/A (year-round climate)" },
        ],
      },
      {
        id: "engineHours",
        label: "Engine Hours",
        type: "text",
        placeholder: "e.g. 650 hrs",
      },
    ],
    symptoms: [
      "Won't start",
      "Overheating",
      "Loss of power",
      "Trim / tilt failure",
      "Electrical issues",
      "Fuel system problems",
      "Water in fuel",
      "Steering problems",
      "Vibration",
      "Corrosion / zinc issues",
    ],
    errorCodeHint: "e.g. Yamaha fault code, Mercury MercMonitor code",
    identifierLabel: "HIN",
    usageMetricLabel: "Engine Hours",
    usageMetricPlaceholder: "e.g. 430 hrs",
    locationOptions: [
      { value: "lake", label: "Lake" },
      { value: "river", label: "River" },
      { value: "coastal-bay", label: "Coastal / Bay" },
      { value: "open-ocean", label: "Open Ocean" },
      { value: "marina-dock", label: "Marina / Dock" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 9. Farm & Ag Equipment
  // -------------------------------------------------------------------------
  "farm-ag": {
    id: "farm-ag",
    displayName: "Farm & Ag Equipment",
    fields: [
      {
        id: "ptoTypeHours",
        label: "PTO Type / Hours",
        type: "text",
        placeholder: "e.g. 540 RPM rear PTO, 1,200 hrs",
      },
      {
        id: "hydraulicSystemPressure",
        label: "Hydraulic System Pressure (optional)",
        type: "text",
        placeholder: "e.g. 2,500 PSI standard, currently reading 1,800 PSI",
      },
      {
        id: "implementAttached",
        label: "Implement Attached",
        type: "text",
        placeholder: "e.g. 12-row corn planter, 16-ft disc harrow",
      },
      {
        id: "terrainType",
        label: "Terrain Type",
        type: "select",
        options: [
          { value: "flat-cropland", label: "Flat cropland" },
          { value: "hilly", label: "Hilly" },
          { value: "muddy-wet", label: "Muddy / Wet" },
          { value: "rocky", label: "Rocky" },
          { value: "mixed", label: "Mixed" },
        ],
      },
    ],
    symptoms: [
      "Won't start",
      "Hydraulic failure",
      "PTO not engaging",
      "Overheating",
      "Electrical faults",
      "Steering problems",
      "Transmission issues",
      "Engine smoke",
      "Low power",
      "Implement not working",
    ],
    errorCodeHint: "e.g. John Deere diagnostic trouble code, AGCO fault code",
    identifierLabel: "Serial Number",
    usageMetricLabel: "Engine Hours",
    usageMetricPlaceholder: "e.g. 4,800 hrs",
    locationOptions: [
      { value: "field-cropland", label: "Field / Cropland" },
      { value: "barn-shed", label: "Barn / Shed" },
      { value: "road-transit", label: "Road Transit" },
      { value: "hillside", label: "Hillside" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 10. Compact Equipment
  // -------------------------------------------------------------------------
  "compact-equipment": {
    id: "compact-equipment",
    displayName: "Compact Equipment",
    fields: [
      {
        id: "attachmentType",
        label: "Attachment Type",
        type: "select",
        options: [
          { value: "bucket", label: "Bucket" },
          { value: "forks", label: "Forks / Pallet Forks" },
          { value: "auger", label: "Auger" },
          { value: "breaker", label: "Hydraulic Breaker" },
          { value: "grapple", label: "Grapple" },
          { value: "none-other", label: "None / Other" },
        ],
      },
      {
        id: "hydraulicFlowRate",
        label: "Hydraulic Flow Rate (optional)",
        type: "text",
        placeholder: "e.g. standard flow 21 GPM, high flow 34 GPM",
      },
      {
        id: "trackOrWheel",
        label: "Track or Wheel Configuration",
        type: "select",
        options: [
          { value: "track", label: "Track (rubber or steel)" },
          { value: "wheel", label: "Wheel (tire)" },
          { value: "both", label: "Both / Convertible" },
        ],
      },
    ],
    symptoms: [
      "Won't start",
      "Hydraulic leak",
      "Track / wheel problems",
      "Overheating",
      "Loss of power",
      "Attachment not working",
      "Electrical issues",
      "Strange noises",
      "Slow operation",
      "Warning lights",
    ],
    errorCodeHint: "e.g. Bobcat fault code, Cat SIS code, Kubota diagnostic code",
    identifierLabel: "Serial Number",
    usageMetricLabel: "Engine Hours",
    usageMetricPlaceholder: "e.g. 2,200 hrs",
    locationOptions: [
      { value: "construction-site", label: "Construction Site" },
      { value: "landscaping", label: "Landscaping" },
      { value: "indoor-warehouse", label: "Indoor / Warehouse" },
      { value: "road-work", label: "Road Work" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 11. Lawn & Garden
  // -------------------------------------------------------------------------
  "lawn-garden": {
    id: "lawn-garden",
    displayName: "Lawn & Garden",
    fields: [
      {
        id: "engineType",
        label: "Engine / Power Type",
        type: "select",
        options: [
          { value: "gas", label: "Gas (combustion)" },
          { value: "electric-battery", label: "Electric / Battery" },
          { value: "manual-reel", label: "Manual / Reel (no engine)" },
        ],
      },
      {
        id: "deckBladeSize",
        label: "Deck / Blade Size",
        type: "text",
        placeholder: 'e.g. 21" deck, 48" zero-turn deck',
      },
      {
        id: "selfPropelled",
        label: "Self-Propelled / Drive Type",
        type: "select",
        options: [
          { value: "yes", label: "Yes — self-propelled (walk-behind)" },
          { value: "no", label: "No — push only" },
          { value: "riding-zero-turn", label: "Riding / Zero-Turn" },
        ],
      },
    ],
    symptoms: [
      "Won't start",
      "Runs rough",
      "Cuts unevenly",
      "Won't move / self-propel",
      "Overheating",
      "Excessive vibration",
      "Blade won't engage",
      "Smoking",
      "Leaking oil / gas",
      "Electrical issues",
    ],
    errorCodeHint: "e.g. Husqvarna error code, Cub Cadet fault code",
    identifierLabel: "Serial Number",
    usageMetricLabel: "Age (years)",
    usageMetricPlaceholder: "e.g. 4 years old",
    locationOptions: [
      { value: "residential-yard", label: "Residential Yard" },
      { value: "commercial-property", label: "Commercial Property" },
      { value: "sports-field", label: "Sports Field" },
      { value: "orchard-garden", label: "Orchard / Garden" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 12. Power Tools
  // -------------------------------------------------------------------------
  "power-tools": {
    id: "power-tools",
    displayName: "Power Tools",
    fields: [
      {
        id: "powerSource",
        label: "Power Source",
        type: "select",
        options: [
          { value: "corded-electric", label: "Corded Electric" },
          { value: "battery-cordless", label: "Battery / Cordless" },
          { value: "gas", label: "Gas (combustion)" },
          { value: "pneumatic", label: "Pneumatic (air-powered)" },
        ],
      },
      {
        id: "batteryVoltage",
        label: "Battery Voltage (if cordless)",
        type: "text",
        placeholder: "e.g. 18V, 20V MAX, 60V FLEXVOLT",
      },
      {
        id: "toolAge",
        label: "Tool Age",
        type: "select",
        options: [
          { value: "less-than-1yr", label: "Less than 1 year" },
          { value: "1-3yrs", label: "1–3 years" },
          { value: "3-5yrs", label: "3–5 years" },
          { value: "5plus-yrs", label: "5+ years" },
        ],
      },
    ],
    symptoms: [
      "Won't power on",
      "Battery not charging",
      "Loss of power",
      "Overheating",
      "Excessive vibration",
      "Strange noises",
      "Motor smoking",
      "Trigger malfunction",
      "Chuck / blade issues",
      "Battery draining fast",
    ],
    errorCodeHint: "e.g. Milwaukee ONE-KEY error, DEWALT tool alert code",
    identifierLabel: "Serial Number",
    usageMetricLabel: "Age (years)",
    usageMetricPlaceholder: "e.g. 2 years old",
    locationOptions: [
      { value: "job-site", label: "Job Site" },
      { value: "home-workshop", label: "Home Workshop" },
      { value: "commercial-shop", label: "Commercial Shop" },
      { value: "outdoor", label: "Outdoor" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 13. HVAC & Home Systems
  // -------------------------------------------------------------------------
  hvac: {
    id: "hvac",
    displayName: "HVAC & Home Systems",
    fields: [
      {
        id: "systemType",
        label: "System Type",
        type: "select",
        options: [
          { value: "central-ac", label: "Central AC" },
          { value: "heat-pump", label: "Heat Pump" },
          { value: "furnace", label: "Furnace / Forced Air" },
          { value: "mini-split", label: "Mini-Split (ductless)" },
          { value: "window-unit", label: "Window Unit" },
          { value: "boiler", label: "Boiler / Radiant" },
        ],
      },
      {
        id: "fuelSource",
        label: "Fuel / Energy Source",
        type: "select",
        options: [
          { value: "electric", label: "Electric" },
          { value: "natural-gas", label: "Natural Gas" },
          { value: "propane", label: "Propane" },
          { value: "oil", label: "Heating Oil" },
        ],
      },
      {
        id: "refrigerantType",
        label: "Refrigerant Type",
        type: "select",
        options: [
          { value: "r-410a", label: "R-410A (Puron)" },
          { value: "r-22", label: "R-22 (Freon — legacy)" },
          { value: "r-32", label: "R-32" },
          { value: "unknown", label: "Unknown" },
        ],
      },
      {
        id: "unitAge",
        label: "Unit Age",
        type: "text",
        placeholder: "e.g. 8 years, installed 2017",
      },
      {
        id: "underWarranty",
        label: "Under Warranty?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unknown", label: "Unknown" },
        ],
      },
      {
        id: "thermostatType",
        label: "Thermostat Type",
        type: "select",
        options: [
          { value: "smart", label: "Smart (Nest, Ecobee, etc.)" },
          { value: "programmable", label: "Programmable (non-smart)" },
          { value: "manual", label: "Manual / Dial" },
          { value: "none-unknown", label: "None / Unknown" },
        ],
      },
    ],
    symptoms: [
      "Not cooling",
      "Not heating",
      "Short cycling",
      "Strange noises",
      "Weak airflow",
      "Thermostat unresponsive",
      "Water leaking",
      "Ice forming on unit",
      "High energy bills",
      "Unusual smells",
    ],
    errorCodeHint: "e.g. Carrier fault code E1, Trane error 79",
    identifierLabel: "Serial Number",
    usageMetricLabel: "Age (years)",
    usageMetricPlaceholder: "e.g. 8 years",
    locationOptions: [
      { value: "residential-home", label: "Residential Home" },
      { value: "commercial-building", label: "Commercial Building" },
      { value: "apartment", label: "Apartment" },
      { value: "garage-shop", label: "Garage / Shop" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 14. Golf Carts & LSVs
  // -------------------------------------------------------------------------
  "golf-carts": {
    id: "golf-carts",
    displayName: "Golf Carts & LSVs",
    fields: [
      {
        id: "powerSource",
        label: "Power Source",
        type: "select",
        options: [
          { value: "gas", label: "Gas (combustion)" },
          { value: "electric-lead-acid", label: "Electric — Lead Acid batteries" },
          { value: "electric-lithium", label: "Electric — Lithium batteries" },
        ],
      },
      {
        id: "batteryAge",
        label: "Battery Age (if electric)",
        type: "text",
        placeholder: "e.g. 3 years old, replaced 2022",
      },
      {
        id: "controllerType",
        label: "Controller Type (optional)",
        type: "text",
        placeholder: "e.g. Curtis 1234, Alltrax AXE, stock OEM",
      },
    ],
    symptoms: [
      "Won't start / move",
      "Slow speed",
      "Battery not charging",
      "Jerky acceleration",
      "Strange noises",
      "Brake problems",
      "Steering issues",
      "Lights not working",
      "Runs then stops",
      "Won't hold charge",
    ],
    errorCodeHint: "e.g. EZGO fault code, Club Car error, Yamaha diagnostic code",
    identifierLabel: "Serial Number",
    usageMetricLabel: "Age (years)",
    usageMetricPlaceholder: "e.g. 6 years old",
    locationOptions: [
      { value: "golf-course", label: "Golf Course" },
      { value: "gated-community", label: "Gated Community" },
      { value: "neighborhood-streets", label: "Neighborhood Streets" },
      { value: "resort-campus", label: "Resort / Campus" },
      { value: "other", label: "Other" },
    ],
  },

  // -------------------------------------------------------------------------
  // 15. Electronics & Devices
  // -------------------------------------------------------------------------
  electronics: {
    id: "electronics",
    displayName: "Electronics & Devices",
    fields: [
      {
        id: "deviceType",
        label: "Device Type",
        type: "select",
        options: [
          { value: "phone", label: "Phone (smartphone)" },
          { value: "tablet", label: "Tablet" },
          { value: "laptop", label: "Laptop" },
          { value: "desktop", label: "Desktop / Tower" },
          { value: "smart-watch", label: "Smart Watch / Wearable" },
          { value: "gaming-console", label: "Gaming Console" },
          { value: "smart-home", label: "Smart Home Device" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "osAndVersion",
        label: "Operating System & Version",
        type: "text",
        placeholder: "e.g. iOS 17.4, Android 14, Windows 11, macOS Sonoma",
      },
      {
        id: "storageCapacity",
        label: "Storage Capacity",
        type: "text",
        placeholder: "e.g. 256 GB, 1 TB SSD",
      },
      {
        id: "batteryHealthPercent",
        label: "Battery Health %",
        type: "text",
        placeholder: "e.g. 78% (found in Settings > Battery)",
      },
      {
        id: "errorMessages",
        label: "Error Messages Displayed",
        type: "text",
        placeholder: "e.g. 'Storage almost full', Blue Screen 0x0000007E",
      },
    ],
    symptoms: [
      "Won't power on",
      "Battery draining fast",
      "Screen issues",
      "Overheating",
      "Slow performance",
      "Connectivity problems",
      "Storage full",
      "App crashes",
      "Audio / speaker issues",
      "Charging problems",
    ],
    errorCodeHint: "e.g. Windows BSOD stop code, Apple error -50, Android error code",
    identifierLabel: "IMEI",
    usageMetricLabel: "Age (years)",
    usageMetricPlaceholder: "e.g. 2 years old",
    locationOptions: [
      { value: "home", label: "Home" },
      { value: "office", label: "Office" },
      { value: "outdoor", label: "Outdoor" },
      { value: "vehicle", label: "Vehicle" },
      { value: "other", label: "Other" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Retrieve the configuration for a given equipment category ID.
 *
 * @param categoryId - The category key (e.g. `"automotive"`, `"marine"`).
 * @returns The matching {@link EquipmentConfig}, or `undefined` if not found.
 *
 * @example
 * const config = getEquipmentConfig("marine");
 * if (config) {
 *   console.log(config.identifierLabel); // "HIN"
 * }
 */
export function getEquipmentConfig(categoryId: string): EquipmentConfig | undefined {
  return EQUIPMENT_CONFIGS[categoryId];
}
