import ProjectA from "@/components/project-a";

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
  </section>
);

export default Home;
