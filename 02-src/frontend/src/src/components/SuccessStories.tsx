import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Car, Ship, Thermometer, Wrench } from "lucide-react";

const SuccessStories = () => {
  const scenarios = [
    {
      equipment: "Car — Check Engine Light",
      icon: Car,
      problem: "P0420 code, shop quotes $1,200 catalytic converter replacement",
      howItHelps:
        "DiagnosticPro identifies that P0420 is often caused by a failing O2 sensor or exhaust leak — not always the converter itself. Your report includes the specific tests a shop should run before replacing the cat, fair pricing for each possibility, and word-for-word questions to ask the mechanic.",
      category: "Automotive",
    },
    {
      equipment: "Boat — Engine Overheating",
      icon: Ship,
      problem: "Marine engine overheating at low RPM, marina quotes full impeller and thermostat replacement",
      howItHelps:
        "DiagnosticPro analyzes the symptoms and identifies raw water intake blockage as the most likely cause — a common issue that costs nothing but a visual inspection. Your report covers the full differential diagnosis, manufacturer-specific cooling system checks, and what to demand the marina verify before authorizing expensive part replacements.",
      category: "Marine",
    },
    {
      equipment: "HVAC — System Short Cycling",
      icon: Thermometer,
      problem: "AC turns on and off every few minutes, HVAC company quotes $2,500 compressor replacement",
      howItHelps:
        "DiagnosticPro identifies short cycling patterns consistent with a dirty condenser coil or failed run capacitor — both under $50 to fix. Your report explains the diagnostic sequence a qualified HVAC tech should follow, flags the compressor replacement as premature without proper testing, and includes fair pricing benchmarks.",
      category: "HVAC",
    },
    {
      equipment: "Diesel Truck — DPF Regeneration Failure",
      icon: Wrench,
      problem: "DPF light on, dealer quotes $4,000 for DPF replacement and forced regen",
      howItHelps:
        "DiagnosticPro analyzes diesel aftertreatment patterns and identifies that a failed sensor or software update may resolve the issue. Your report includes the specific J1939 codes to look for, dealer vs independent shop cost comparison, and questions to verify whether the DPF actually needs replacement or just a forced regeneration.",
      category: "Diesel Trucks",
    },
  ];

  return (
    <section id="success-stories" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="bg-savings/10 text-savings border-savings/20 mb-4">
              <CheckCircle className="h-3 w-3 mr-1" />
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              What Your $4.99 Report Covers
              <span className="block text-savings">Real Equipment, Real Guidance</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Each report is a 2,000+ word analysis tailored to your exact equipment and symptoms.
              Here's what that looks like for different types of equipment.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {scenarios.map((scenario, index) => {
              const Icon = scenario.icon;
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-savings to-trust" />
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{scenario.equipment}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {scenario.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-ripoff mb-1">The situation:</p>
                      <p className="text-sm text-muted-foreground">{scenario.problem}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-savings mb-1">What your report provides:</p>
                      <p className="text-sm text-muted-foreground">{scenario.howItHelps}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-background rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Every Report Includes</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-savings mx-auto mb-2" />
                  <div className="font-semibold">Root Cause Analysis</div>
                  <div className="text-sm text-muted-foreground">Ranked likely causes with confidence levels</div>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-trust mx-auto mb-2" />
                  <div className="font-semibold">Cost Verification</div>
                  <div className="text-sm text-muted-foreground">Fair pricing benchmarks and overcharge detection</div>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold">Shop Scripts</div>
                  <div className="text-sm text-muted-foreground">Word-for-word questions to ask your mechanic</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
