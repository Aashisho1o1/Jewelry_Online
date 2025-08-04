import settingsContent from "@/content/settings.json";
import aboutContent from "@/content/about.json";

export default function Footer() {
  const { social, footer } = settingsContent;
  const { contact } = aboutContent;

  return (
    <footer className="border-t">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-3">Contact</h3>
            <p className="text-sm text-muted-foreground">
              {contact.email && (
                <>
                  <a 
                    href={`mailto:${contact.email}`}
                    className="hover:text-primary underline"
                  >
                    {contact.email}
                  </a>
                  <br />
                </>
              )}
              {contact.phone && (
                <>
                  <a 
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    className="hover:text-primary underline"
                  >
                    {contact.phone}
                  </a>
                  <br />
                </>
              )}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Hours</h3>
            <p className="text-sm text-muted-foreground">
              Monday - Friday: 9am - 5pm
              <br />
              Saturday: By appointment
              <br />
              Sunday: Closed
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Follow Us</h3>
            <div className="flex gap-4">
              {social?.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Instagram
                </a>
              )}
              {social?.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Facebook
                </a>
              )}
              {social?.linkedin && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t">
          <div className="text-center text-sm text-muted-foreground">
            {footer?.copyright || `© ${new Date().getFullYear()} ${settingsContent.companyName || 'Aadarsh Jewellers'}. All rights reserved.`}
          </div>
        </div>
      </div>
    </footer>
  );
}