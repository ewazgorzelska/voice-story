import { Card, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonCard = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Skeleton className="w-full h-48 rounded-t-xl rounded-b-none" />
      </CardHeader>
      <CardFooter className="flex flex-col items-start gap-3 p-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
};

export { SkeletonCard };
