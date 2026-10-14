import Spinner from "@/components/ui/Spinner";

export default function ProductLoading() {
  return (
    <div className="container-page flex min-h-64 items-center justify-center py-16">
      <Spinner label="Loading product" className="h-8 w-8" />
    </div>
  );
}