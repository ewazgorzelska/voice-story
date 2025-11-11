import { Card, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import type { StorySummaryDto } from "@/types";

interface StoryCardProps {
  story: StorySummaryDto;
}

const StoryCard = ({ story }: StoryCardProps) => {
  const handleClick = () => {
    window.location.href = `/stories/${story.slug}`;
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
      onClick={handleClick}
    >
      <CardHeader className="p-0">
        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
          {story.cover_image_url ? (
            <img src={story.cover_image_url} alt={story.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <svg
              className="w-16 h-16 text-primary/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          )}
        </div>
      </CardHeader>
      <CardFooter className="flex flex-col items-start gap-3 p-4">
        <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
        <Button
          variant="default"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          Select story
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StoryCard;
