import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wrench, Ship, Thermometer } from "lucide-react";

const ProblemSection = () => {
  const scenarios = [
    {
      title: "Rough Idle Problem",
      subtitle: 'How "parts throwing" turns a $30 fix into a $1,430 nightmare',
      icon: Wrench,
      shopSteps: [
        { label: "Replace spark plugs", cost: "$200" },
        { label: "Replace ignition coils", cost: "$400" },
        { label: "Replace fuel injectors", cost: "$800" },
        { label: "Finally find vacuum hose", cost: "$30", highlight: true },
      ],
      shopTotal: "$1,430",
      ourSteps: [
        { label: "AI diagnosis fee", cost: "$4.99" },
        { label: "Finds vacuum hose leak immediately", cost: "$30", highlight: true },
      ],
      ourTotal: "$34.99",
      saved: "$1,395",
    },
    {
      title: "Boat Won't Start",
      subtitle: 'Marina quotes full fuel system replacement — it was a $15 fuel filter',
      icon: Ship,
      shopSteps: [
        { label: "Replace fuel pump", cost: "$450" },
        { label: "Replace fuel lines", cost: "$320" },
        { label: "Replace fuel injectors", cost: "$600" },
        { label: "Issue was clogged fuel filter", cost: "$15", highlight: true },
      ],
      shopTotal: "$1,385",
      ourSteps: [
        { label: "AI diagnosis fee", cost: "$4.99" },
        { label: "Identifies fuel filter as likely cause", cost: "$15", highlight: true },
      ],
      ourTotal: "$19.99",
      saved: "$1,365",
    },
    {
      title: "AC Not Cooling",
      subtitle: 'HVAC company quotes new compressor — it was a $40 capacitor',
      icon: Thermometer,
      shopSteps: [
        { label: "Replace compressor", cost: "$1,400" },
        { label: "Replace refrigerant lines", cost: "$350" },
        { label: "Recharge refrigerant", cost: "$250" },
        { label: "Issue was a failed capacitor", cost: "$40", highlight: true },
      ],
      shopTotal: "$2,040",
      ourSteps: [
        { label: "AI diagnosis fee", cost: "$4.99" },
        { label: "Identifies capacitor failure pattern", cost: "$40", highlight: true },
      ],
      ourTotal: "$44.99",
      saved: "$1,995",
    },
  ];

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="bg-ripoff/10 text-ripoff border-ripoff/20 mb-4">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Stop Expensive Guessing
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              How Misdiagnosis Costs You Money
              <span className="block text-primary">See the Difference</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Shops often replace parts until something works. Here's how knowing the root cause
              first changes the math — across cars, boats, HVAC, and more.
            </p>
          </div>

          <div className="space-y-12">
            {scenarios.map((scenario, idx) => {
              const Icon = scenario.icon;
              return (
                <div key={idx} className="bg-background rounded-2xl p-8 shadow-lg">
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Icon className="h-6 w-6 text-primary" />
                      <h3 className="text-2xl font-bold">{scenario.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{scenario.subtitle}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-ripoff flex items-center">
                        <Wrench className="h-5 w-5 mr-2" />
                        Parts-Throwing Approach
                      </h4>
                      <div className="space-y-3">
                        {scenario.shopSteps.map((step, i) => (
                          <div
                            key={i}
                            className={`flex justify-between items-center p-3 rounded-lg ${
                              step.highlight
                                ? "bg-ripoff/20 border-2 border-ripoff/30"
                                : "bg-ripoff/10"
                            }`}
                          >
                            <span className={step.highlight ? "font-semibold" : ""}>{step.label}</span>
                            <span className="font-semibold text-ripoff">{step.cost}</span>
                          </div>
                        ))}
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total Cost</span>
                            <span className="text-ripoff">{scenario.shopTotal}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-savings flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        DiagnosticPro Approach
                      </h4>
                      <div className="space-y-3">
                        {scenario.ourSteps.map((step, i) => (
                          <div
                            key={i}
                            className={`flex justify-between items-center p-3 rounded-lg ${
                              step.highlight
                                ? "bg-savings/20 border-2 border-savings/30"
                                : "bg-savings/10"
                            }`}
                          >
                            <span className={step.highlight ? "font-semibold" : ""}>{step.label}</span>
                            <span className="font-semibold text-savings">{step.cost}</span>
                          </div>
                        ))}
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total Cost</span>
                            <span className="text-savings">{scenario.ourTotal}</span>
                          </div>
                          <div className="text-right mt-2">
                            <span className="text-2xl font-bold text-savings">{scenario.saved} Saved</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            These scenarios illustrate how misdiagnosis typically inflates repair costs. Your actual savings depend on your specific situation.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
