import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shuffle, Star, Calendar } from "lucide-react";

export default function MovieNight() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Movie Night</h1>
        </div>
        <p className="text-muted-foreground">
          Decide what to watch right now with friends present
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed border-2 border-primary/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Coming Soon!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            The Movie Night planning feature is currently in development. Soon
            you'll be able to:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span>Select who's present</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-primary" />
                <span>See movies ranked by group interest</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Shuffle className="h-4 w-4 text-primary" />
                <span>Get random suggestions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Filter by genre preferences</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button disabled className="mx-auto">
              <Shuffle className="h-4 w-4 mr-2" />
              Surprise Me (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-lg">Who's Present?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Multi-select friend picker</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Real-time availability status</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-lg">Smart Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Ranked by group desire scores</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Factor in external ratings</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
