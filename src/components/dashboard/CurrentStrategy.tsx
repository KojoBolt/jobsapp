import { Badge } from "@/components/ui/badge";
import { Crosshair, Building2, Briefcase } from "lucide-react";

const currentStrategy = {
  roles: ["Senior PM", "Frontend Engineer", "Tech Lead"],
  companySizes: ["Series A Startup", "Series B-C", "Fortune 500"],
  industry: "Engineering",
  tone: "Professional",
};

const CurrentStrategy = () => {
  return (
    <div className="space-y-3 px-3">
      <div className="flex items-center gap-2">
        <Crosshair className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Current Strategy
        </span>
      </div>

      {/* Target Roles */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Briefcase className="h-3 w-3" />
          Target Roles
        </div>
        <div className="flex flex-wrap gap-1">
          {currentStrategy.roles.map((role) => (
            <Badge
              key={role}
              variant="human"
              className="text-[9px] px-1.5 py-0"
            >
              {role}
            </Badge>
          ))}
        </div>
      </div>

      {/* Company Size */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Building2 className="h-3 w-3" />
          Company Size
        </div>
        <div className="flex flex-wrap gap-1">
          {currentStrategy.companySizes.map((size) => (
            <Badge
              key={size}
              variant="outline"
              className="text-[9px] px-1.5 py-0 text-muted-foreground"
            >
              {size}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurrentStrategy;
