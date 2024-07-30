import dynamic from "next/dynamic";

const ServerHeader = dynamic(() => import("./server"), { ssr: false });

const Header = () => {
  return <ServerHeader />;
};

export default Header;
