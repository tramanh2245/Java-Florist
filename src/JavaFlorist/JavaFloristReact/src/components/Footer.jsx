import { NavLink } from "react-router-dom";
import logo from "../assets/logo/logo1.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookSquare,
  faInstagram,
  faLinkedin,
  faXTwitter
} from "@fortawesome/free-brands-svg-icons";


export default function Footer() {
  return (
    <footer className="bg-white border-t border-pink-100 text-gray-700 py-16 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-10 text-sm">

        {/* Informations */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
          <ul className="space-y-2">
            <li className="hover:text-[#c05f7e] transition cursor-pointer">About Us</li>
            <li className="hover:text-[#c05f7e] transition cursor-pointer">Career with Us</li>
            <li className="hover:text-[#c05f7e] transition cursor-pointer">Care Tips</li>
            <li className="hover:text-[#c05f7e] transition cursor-pointer">Corporate Flowers</li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Support</h3>
          <ul className="space-y-2">
            <li className="hover:text-[#c05f7e] transition cursor-pointer">FAQ</li>
            <li className="hover:text-[#c05f7e] transition cursor-pointer">Contact Us</li>
          </ul>
        </div>

        {/* Center Logo */}
        <div className="flex flex-col items-center justify-center mb-20 cursor-default">
  <img
    src={logo}
    alt="Java Florist"
    className="w-20 h-20 object-contain mb-3 transition-transform duration-500 hover:scale-110"
  />
</div>


        {/* Policies */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Policies</h3>
          <ul className="space-y-2 mb-6">
            <li className="hover:text-[#c05f7e] transition cursor-pointer">Substitution Policy</li>
            <li className="hover:text-[#c05f7e] transition cursor-pointer">Privacy Policy</li>
            <li className="hover:text-[#c05f7e] transition cursor-pointer">Terms of Service</li>
            <li className="hover:text-[#c05f7e] transition cursor-pointer">Refund Policy</li>
            <li className="hover:text-[#c05f7e] transition cursor-pointer">Return & Cancellation</li>
          </ul>
        </div>

       {/* Address + Map + Social */}
<div>
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Us</h3>

  {/* Address */}
 <p className="text-gray-600 mb-4 leading-relaxed">
  Mumbai, Maharashtra,<br />
  Aptech House, A-65, MIDC, Marol,<br />
  Andheri (East), Mumbai,<br />
  400093.
</p>

  {/* Social Icons */}
<div className="flex items-center gap-5 text-2xl">

  {/* Facebook */}
  <a href="#" className="text-gray-600 hover:text-[#1877f2] transition">
    <FontAwesomeIcon icon={faFacebookSquare} />
  </a>

  {/* Instagram */}
  <a href="#" className="text-gray-600 hover:text-[#C13584] transition">
    <FontAwesomeIcon icon={faInstagram} />
  </a>

  {/* LinkedIn */}
  <a href="#" className="text-gray-600 hover:text-[#0077b5] transition">
    <FontAwesomeIcon icon={faLinkedin} />
  </a>

  {/* X / Twitter */}
  <a href="#" className="text-gray-600 hover:text-black transition">
    <FontAwesomeIcon icon={faXTwitter} />
  </a>

</div>
</div>


      </div>

      {/* Copyright */}
      <div className="mt-12 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Java Florist. All rights reserved.
      </div>
    </footer>
  );
}
