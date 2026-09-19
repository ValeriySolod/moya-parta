export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
