const counties = [
  "Baringo", "Bomet", "Elgeyo-Marakwet", "Kajiado", "Kericho", "Laikipia",
  "Nakuru", "Nandi", "Narok", "Samburu", "Trans-Nzoia", "Turkana", "Uasin Gishu",
  "West Pokot", "Bungoma", "Busia", "Kakamega", "Vihiga", "Kisumu", "Siaya",
  "Homa Bay", "Migori", "Kisii", "Nyamira"
];

export default function CountyTicker() {
  const items = [...counties, ...counties];
  return (
    <div className="bg-gray-100 border-t border-gray-200 overflow-hidden py-2.5 relative">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((county, i) => (
          <span key={i} className="text-xs text-gray-500 font-medium flex items-center">
            <span className="mx-4">{county}</span>
            <span className="text-gray-300 text-[8px]">●</span>
          </span>
        ))}
      </div>
    </div>
  );
}
