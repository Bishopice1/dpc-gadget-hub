import Spinner from "@/components/ui/Spinner";

export default function RootLoading() {
  return (
    <div className="container-page flex min-h-[50vh] items-center justify-center">
      <Spinner label="Loading page" className="h-8 w-8" />
    </div>
  );
}