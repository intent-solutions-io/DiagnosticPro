import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { loginWithWhop, getWhopAuth, logoutWhop } from "@/lib/whop-auth";

interface WhopLoginButtonProps {
  className?: string;
}

const WhopLoginButton = ({ className = "" }: WhopLoginButtonProps) => {
  const auth = getWhopAuth();

  if (auth) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="text-sm text-muted-foreground">
          {auth.user.name || auth.user.username}
        </span>
        {auth.isMember && (
          <span className="text-xs bg-savings text-savings-foreground px-2 py-1 rounded-full font-medium">
            PRO MEMBER
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { logoutWhop(); window.location.reload(); }}
          className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2"
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => loginWithWhop()}
      className={`gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 ${className}`}
    >
      <Crown className="h-4 w-4" />
      Login with Whop
    </Button>
  );
};

export default WhopLoginButton;
