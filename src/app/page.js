import ProjectA from "@/components/project-a";
import ProjectB from "@/components/project-b";

const Home = () => (
  <section className="row flow-column-wrap align-start">
    <div>
      <h1>Luxa Club!</h1>
      <p>
        Welcome to Luxa's exploration labs! If you're here, you're part of the
        club. 🧩
      </p>
    </div>
    <ProjectA />
    <ProjectB />
  </section>
);

export default Home;
