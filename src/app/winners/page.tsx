import { Metadata } from "next";
import { YouTubeEmbed } from "@/components/youtube-embed";

export const metadata: Metadata = {
  title: "Wall of Winners — Saad Belcaid",
  description:
    "Real results from SSM and Connector OS members. Video proof of operators closing deals and building businesses.",
};

const winners = [
  { id: "tODPz6Y9fWc", title: "21 year old goes from $55 to $1,500/m in 30 days" },
  { id: "CU5IFIWGqYI", title: "How This Guy Went From $400 To $27,000/mo" },
  { id: "MiblqoYi1_8", title: "From $0 To $30K/Mo At Only 22 Years" },
  { id: "BCbyAl_VZ7A", title: "20 Year Old Student Makes $40K/Mo Selling Sales Systems" },
  { id: "jkxloHa7i_s", title: "Complete beginner makes $4,500 with sales systems" },
  { id: "CApN_D1R4tE", title: "Member closed €2.5k from one outreach msg" },
  { id: "4Y59gJTMnMI", title: "From $3.5k first client to $200k/year" },
  { id: "gBR7DZnS964", title: "First $3,500 retainer client — watch me help him do the work" },
  { id: "WtlNFr0SHww", title: "Making $4,500 As Complete Beginner" },
  { id: "hdx1jMHtuaw", title: "Making $5,500 in 30 days as a complete beginner" },
  { id: "ReGKMkt33dA", title: "Making $6,000 As A One-Man Agency" },
  { id: "27FSHCmLEcQ", title: "From Lost To Making $1.5K With Sales Systems" },
  { id: "je5Yhg2GPFk", title: "Making $5,000 In 7 days with AI sales systems" },
  { id: "2XCGhsztVZI", title: "This boring industry made him $4k" },
  { id: "oCybwKhp-b8", title: "College Graduate Turned Down $120K Job To Build a $25K/m Agency" },
  { id: "qHUYxLRivxM", title: "Built a $13K/month agency while working a 9-5" },
  { id: "8O99Xg2s3cU", title: "Made $7,300 in one hour with 0 experience" },
  { id: "OmuJQC403xM", title: "Made $30k/mo in 16 days at 19 years old" },
];

export default function WallOfWinners() {
  return (
    <div>
      <div className="mb-12">
        <h1 className="font-[family-name:var(--font-geist-sans)] text-2xl font-semibold tracking-tight text-neutral-100">
          Wall of Winners
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          I wish I could include more — but here are some of the people that were able to build a real business, upgrade their lifestyle. Definitely take a look. Most of them are now operating on their own, which I think is the main reason I keep doing this.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {winners.map((video) => (
          <YouTubeEmbed key={video.id} id={video.id} title={video.title} />
        ))}
      </div>
    </div>
  );
}
