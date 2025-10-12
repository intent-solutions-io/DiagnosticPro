import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Wrench, Search } from "lucide-react";

const SuccessStories = () => {
  const scenarios = [
    {
      title: "Engine Overheating Analysis",
      equipment: "Automotive Engine",
      problem: "Temperature gauge reading high",
      commonMisdiagnosis: "Expensive engine rebuild recommended",
      actualCause: "Often a faulty sensor or thermostat",
      potentialSavings: "Could save $2,000+ by diagnosing correctly",
      icon: AlertCircle,
      category: "Common Scenario",
    },
    {
      title: "Marine Engine Won't Start",
      equipment: "Boat Engine",
      problem: "Engine cranks but won't fire",
      commonMisdiagnosis: "Full fuel system replacement",
      actualCause: "Frequently a clogged fuel filter or bad fuel",
      potentialSavings: "Could save $1,000+ with proper diagnosis",
      icon: Wrench,
      category: "Educational Example",
    },
    {
      title: "Check Engine Light",
      equipment: "Vehicle Diagnostics",
      problem: "Dashboard warning light illuminated",
      commonMisdiagnosis: "Expensive catalytic converter replacement",
      actualCause: "May be something simple like a loose gas cap",
      potentialSavings: "Could save $800+ by checking simple causes first",
      icon: Search,
      category: "Common Scenario",
    },
    {
      title: "HVAC System Not Cooling",
      equipment: "Climate Control",
      problem: "Air conditioning producing warm air",
      commonMisdiagnosis: "Complete compressor replacement",
      actualCause: "Often just a capacitor or refrigerant issue",
      potentialSavings: "Could save $1,500+ with accurate diagnosis",
      icon: CheckCircle,
      category: "Educational Example",
    },
  ];

  return (
    <section id="diagnostic-scenarios" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-4">
              <CheckCircle className="h-3 w-3 mr-1" />
              Educational Examples
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Common Diagnostic Scenarios
              <span className="block text-primary">Learn What to Look For</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              These are educational examples of common equipment problems. Your actual diagnosis will
              be based on your specific symptoms and equipment details. Results may vary.
            </p>
          </div>

          {/* Scenarios Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {scenarios.map((scenario, index) => {
              const Icon = scenario.icon;
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{scenario.title}</h4>
                          <p className="text-sm text-muted-foreground">{scenario.equipment}</p>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-fit text-xs mt-2">
                      {scenario.category}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        REPORTED SYMPTOM
                      </div>
                      <p className="text-sm">{scenario.problem}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-destructive/70 mb-1">
                        COMMON MISDIAGNOSIS
                      </div>
                      <p className="text-sm text-muted-foreground">{scenario.commonMisdiagnosis}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-success/70 mb-1">
                        WHAT TO CHECK FIRST
                      </div>
                      <p className="text-sm text-muted-foreground">{scenario.actualCause}</p>
                    </div>
                    <div className="pt-3 border-t border-border/50">
                      <p className="text-xs text-primary font-medium">
                        {scenario.potentialSavings}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Important Disclaimer */}
          <div className="bg-background rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">How DiagnosticPro Helps</h3>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Our AI analyzes <strong>your specific symptoms</strong> across 14 comprehensive
                categories to help you understand what might be wrong with your equipment. We provide
                educational information to help you make informed decisions.
              </p>
              <div className="grid md:grid-cols-3 gap-6 pt-6">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-lg font-bold">14-Point Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    Comprehensive diagnostic framework
                  </div>
                </div>
                <div className="text-center">
                  <Search className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-lg font-bold">AI-Powered</div>
                  <div className="text-sm text-muted-foreground">
                    Data-driven insights for your symptoms
                  </div>
                </div>
                <div className="text-center">
                  <Wrench className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-lg font-bold">$4.99</div>
                  <div className="text-sm text-muted-foreground">Educational diagnostic report</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-4 max-w-2xl mx-auto">
                <strong>Disclaimer:</strong> The examples above are for educational purposes only.
                DiagnosticPro provides AI-powered analysis based on the information you provide. This
                is not a substitute for professional mechanical inspection. Actual results will vary
                based on your specific equipment and situation. Always consult qualified professionals
                for repairs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
