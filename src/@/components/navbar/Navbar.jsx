import React, { useState, useEffect, useRef } from 'react';
import Headroom from 'react-headroom';
import './navbar.css';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';
import logo from '../../../main_assets/logo.png';

const Menu = ({ closeMenu }) => (
  <>
    <p>
      <NavLink to="/" exact className="nav-link" activeClassName="active" onClick={closeMenu}>
        <i aria-hidden="true" className="home icon"></i>
        {/* Home */}
      </NavLink>
    </p>
    <p>
      <NavLink to="/about" className="nav-link" activeClassName="active" onClick={closeMenu}>
        About
      </NavLink>
    </p>
    <p>
      <NavLink to="/work" className="nav-link" activeClassName="active" onClick={closeMenu}>
        Work
      </NavLink>
    </p>
    <p>
      <NavLink to="/ideas" className="nav-link" activeClassName="active" onClick={closeMenu}>
        Ideas
      </NavLink>
    </p>
    <p>
      <NavLink to="/contact" className="nav-link" activeClassName="active" onClick={closeMenu}>
        Contact
      </NavLink>
    </p>
  </>
);

const Navbar = () => {
  const [toggleMenu, setToggleMenu] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setToggleMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeMenu = () => {
    setToggleMenu(false);
  };

  return (
    <Headroom>
      <div className="ulev__navbar">
        <div className="ulev__navbar-links">
          <div className="ulev__navbar-links_logo">
            <Link to="/">
              <img src={logo} alt="logo" />
            </Link>
          </div>
          <div className="ulev__navbar-links_container">
            <Menu closeMenu={closeMenu} />
          </div>
          <div className="ulev__navbar-menu" ref={menuRef}>
            {toggleMenu ? (
              <RiCloseLine color="#fff" size={27} onClick={() => setToggleMenu(false)} />
            ) : (
              <RiMenu3Line color="#fff" size={27} onClick={() => setToggleMenu(true)} />
            )}
            {toggleMenu && (
              <div className="ulev__navbar-menu_container scale-up-center">
                <div className="ulev__navbar-menu_container-links">
                  <Menu closeMenu={closeMenu} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Headroom>
  );
};

export default Navbar;
