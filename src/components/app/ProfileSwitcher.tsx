import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Users, User, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ProfileSwitcher() {
  const { activeProfile, setActiveProfileId, dependents, isLoading } = useProfile();

  if (isLoading) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative flex items-center gap-2 h-8 px-2 border-dashed border">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {activeProfile.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium mr-1 truncate max-w-[100px]">
            {activeProfile.name.split(" ")[0]}
          </span>
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Switch Profile</DropdownMenuLabel>
        
        {/* Primary User (Self) */}
        <DropdownMenuItem 
          onClick={() => setActiveProfileId(null)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1">Self</span>
          {activeProfile.isSelf && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        {dependents.length > 0 && <DropdownMenuSeparator />}
        {dependents.length > 0 && <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Dependents</DropdownMenuLabel>}
        
        {dependents.map((dep) => (
          <DropdownMenuItem
            key={dep.id}
            onClick={() => setActiveProfileId(dep.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Avatar className="h-4 w-4">
              <AvatarFallback className="text-[8px] bg-accent text-accent-foreground">
                {dep.name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate">{dep.name}</span>
            {activeProfile.id === dep.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
