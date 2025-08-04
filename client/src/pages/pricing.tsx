import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import pricingContent from "@/content/pricing.json";
import { CheckmarkIcon } from "@/components/ui/checkmark-icon";

export default function Pricing() {
  return (
    <div className="container py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{pricingContent.title}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
          {pricingContent.subtitle}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {pricingContent.tiers.map((tier) => (
            <Card key={tier.name} className="flex flex-col">
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <p className="text-3xl font-bold pt-2">{tier.price}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckmarkIcon />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-24 text-center">
        <h3 className="text-xl font-semibold">{pricingContent.contract.text}</h3>
        <a
          href={pricingContent.contract.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg mt-4 hover:bg-primary/90 transition-colors"
        >
          {pricingContent.contract.link_text}
        </a>
      </div>
    </div>
  );
} 