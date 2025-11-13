import ControlPageLoading from "@/components/ui/ControlPageLoading";

// Default to supervisor (green) - will be overridden by actual role check
export default function Loading() {
  return <ControlPageLoading role="supervisor" />;
}

