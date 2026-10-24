import { NavLink } from "react-router-dom";
import Icon from "./Icon";

const links = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/vocab", label: "Vocab", icon: "vocab" },
  { to: "/speaking", label: "Speaking", icon: "speaking" },
  { to: "/reading", label: "Reading", icon: "reading" },
  { to: "/slang", label: "Slang", icon: "slang" },
];

// A sidebar on desktop; the same links become a bottom bar on phones (see styles.css).
export default function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Main">
      <div className="brand">
        <span className="brand-tile" aria-hidden="true" />
        <span className="brand-name">Português</span>
      </div>
      <ul className="nav-list">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} end={link.to === "/"} className="nav-link">
              <Icon name={link.icon} />
              <span>{link.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
