import { LockKeyhole, RotateCcw, Star, Truck } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over $150",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "30-day return policy",
  },
  {
    icon: LockKeyhole,
    title: "Secure Payment",
    description: "End-to-end encrypted",
  },
  {
    icon: Star,
    title: "Premium Quality",
    description: "Curated by experts",
  },
];

const BenefitsBar = () => {
  return (
    <section className="border-t border-border bg-auth-bg px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 lg:grid-cols-4 lg:gap-y-0">
        {benefits.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <Icon size={20} strokeWidth={1.5} className="mb-3 text-foreground" />
            <h2 className="text-sm font-medium text-foreground">{title}</h2>
            <p className="mt-1 text-xs text-text-third">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsBar;