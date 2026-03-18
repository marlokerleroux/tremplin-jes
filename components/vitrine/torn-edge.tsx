export function TornEdge({ bgColor = "text-white" }: { bgColor?: string }) {
  return (
    <div className={`w-full overflow-hidden leading-none -mb-px ${bgColor}`}>
      <svg
        viewBox="0 0 1200 50"
        preserveAspectRatio="none"
        className="w-full h-[25px] md:h-[40px] block"
      >
        <path
          d="M0,28 L15,18 L28,26 L50,14 L68,24 L80,16 L100,28 L115,12 L135,22 L148,15 L168,27 L180,17 L200,25 L218,11 L235,23 L250,16 L272,28 L290,13 L305,24 L320,18 L345,26 L360,14 L380,22 L395,17 L415,28 L430,12 L450,24 L468,15 L485,27 L500,18 L520,25 L540,11 L555,23 L570,16 L592,28 L610,13 L625,22 L640,17 L660,26 L680,14 L698,24 L715,16 L735,28 L750,12 L770,22 L785,15 L805,27 L820,18 L840,25 L858,11 L875,23 L890,16 L910,28 L928,13 L945,24 L960,17 L980,26 L1000,14 L1018,22 L1035,16 L1055,28 L1070,12 L1090,24 L1108,15 L1125,27 L1140,18 L1160,25 L1178,13 L1200,22 L1200,50 L0,50 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}
