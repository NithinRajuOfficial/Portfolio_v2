import Contact from "./components/Contact";
import MainContainer from "./components/MainContentStatge";
import MiddleHeader from "./components/middleHeaderCom/MiddleHeader";
import Navbar from "./components/Navbar";
import ProjectContainer from "./components/Project";
import SubHeader from "./components/SubHeader";
import ChatWidget from "./components/ChatWidget";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <div className="relative">
        <Navbar />
        <SubHeader />
        <MiddleHeader />
      </div>
      <MainContainer />
      <ProjectContainer />
      <Contact />
      {/* Floating AI chat assistant — fixed bottom-right */}
      <ChatWidget />
    </main>
  );
}
