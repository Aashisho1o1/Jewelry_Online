import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import aboutContent from "@/content/about.json";

const { title, owners, story, approach, contact } = aboutContent;

export default function About() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{title}</h1>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {owners.map((owner) => (
            <Card key={owner.name}>
            <CardContent className="p-6">
              <AspectRatio ratio={1}>
                <img
                    src={owner.imageUrl}
                    alt={owner.name}
                  className="object-cover w-full h-full rounded-lg"
                />
              </AspectRatio>
              <div className="mt-4">
                  <h2 className="text-2xl font-semibold mb-2">
                    {owner.name}
                  </h2>
                  <h3 className="text-lg text-muted-foreground mb-4">
                    {owner.title}
                  </h3>
                  <p className="text-muted-foreground">{owner.description}</p>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>

        <Card className="mb-12">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{story.title}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {story.content}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-12">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{approach.title}</h2>
            <ol className="space-y-4">
              {approach.steps.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="font-bold">{index + 1}.</span>
                  <div>
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Contact Information Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-medium">Email:</span>
                <a 
                  href={`mailto:${contact.email}`}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {contact.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">Phone:</span>
                <a 
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {contact.phone}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}