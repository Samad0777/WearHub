const Footer = () => {
  const shopLinks = ["New Arrivals", "Men", "Women", "Outerwear", "Accessories", "Sale"];
  const helpLinks = ["Shipping & Returns", "Size Guide", "FAQ", "Contact Us", "Care Guide"];
  const companyLinks = ["About WearHub", "Sustainability", "Careers", "Press", "Privacy Policy"];

  return (
    <footer className="dark w-full bg-background text-foreground">
      <div className="mx-auto max-w-[1600px] px-6 pb-6 pt-10 md:px-12 lg:px-16">
        <div className="grid gap-10 border-border pt-12 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:gap-8">
          <div className="pr-6">
            <div className="mb-8 text-xl font-instrumentSerif leading-none text-foreground">
              WearHub
            </div>
            <p className="max-w-[320px] text-[1.05rem] leading-relaxed text-muted-foreground">
              Modern fashion for the discerning wardrobe. Premium quality, minimal aesthetic, timeless design.
            </p>
          </div>

          <div>
            <h3 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-foreground/80">
              Shop
            </h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              {shopLinks.map((item) => (
                <li key={item} className="transition-colors hover:text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-foreground/80">
              Help
            </h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              {helpLinks.map((item) => (
                <li key={item} className="transition-colors hover:text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-foreground/80">
              Company
            </h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              {companyLinks.map((item) => (
                <li key={item} className="transition-colors hover:text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">© 2026 WearHub. All rights reserved.</p>

          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <span className="transition-colors hover:text-foreground">Terms</span>
            <span className="text-muted-foreground/60">•</span>
            <span className="transition-colors hover:text-foreground">Privacy</span>
            <span className="text-muted-foreground/60">•</span>
            <span className="transition-colors hover:text-foreground">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;