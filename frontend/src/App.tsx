import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>URL Shortener</CardTitle>
          <CardDescription>
            Shorten your long URLs into easy-to-share links
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Enter your URL here..." type="url" />
          <Button className="w-full">Shorten URL</Button>
          <p className="text-sm text-muted-foreground text-center">
            Frontend setup complete. Components ready for implementation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
