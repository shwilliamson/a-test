import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Placeholder Lists page - shown after successful registration
 * Full implementation will be in a separate issue
 */
function ListsPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>My Lists</CardTitle>
          <CardDescription>
            Your todo lists will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Registration successful! Lists feature coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ListsPage;
