import Spinner from "@/components/ui/Spinner";

export default function ShopLoading() {
  return (
    <div className="container-page flex min-h-64 items-center justify-center py-10">
      <Spinner label="Loading shop" className="h-8 w-8" />
    </div>
  );
}