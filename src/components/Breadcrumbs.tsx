import { ChevronLeft } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav className="w-full py-5">
      <ol className="flex items-center flex-wrap text-sm gap-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronLeft className="w-3 h-3 text-store-primary mx-1" />}
            {item.href ? (
              <a href={item.href} className="text-primary hover:text-accent transition-colors whitespace-nowrap">
                {item.label}
              </a>
            ) : (
              <span className="text-store-primary whitespace-nowrap">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
