const { default: Link } = require("next/link");

const Header = () => (
  <header>
    <nav>
      <ul>
        <li>
          <Link href="/">
            <span>Home</span>
          </Link>
        </li>
        <li>
          <Link href="/login">
            <span>Login</span>
          </Link>
        </li>
      </ul>
    </nav>
  </header>
);

export default Header;
