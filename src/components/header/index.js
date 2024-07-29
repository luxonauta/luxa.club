import Link from "next/link";

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
          <Link href="/account/sign-in">
            <span>Sign in</span>
          </Link>
        </li>
      </ul>
    </nav>
  </header>
);

export default Header;
