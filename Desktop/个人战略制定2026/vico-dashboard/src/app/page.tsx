import KPICards from "@/components/dashboard/KPICards";
import StrategicPositioning from "@/components/dashboard/StrategicPositioning";
import ThreeDimensions from "@/components/dashboard/ThreeDimensions";
import CurrentPhase from "@/components/dashboard/CurrentPhase";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">📊 <span className="text-amber-600">战略概览</span></h1>

      <KPICards />
      <StrategicPositioning />
      <ThreeDimensions />
      <CurrentPhase />
    </div>
  );
}
