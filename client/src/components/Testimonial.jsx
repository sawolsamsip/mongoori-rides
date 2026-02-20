import React from "react";
import Title from "./Title";
import { assets } from "../assets/assets";
import { motion } from "framer-motion";

const Testimonial = () => {
  const testimonials = [
    {
      name: "James Chen",
      location: "Irvine, CA",
      testimonial:
        "The Model 3 was in pristine condition. Supercharging around Irvine was so convenient. Best rental experience in Orange County!",
    },
    {
      name: "Sarah Miller",
      location: "Newport Beach, CA",
      testimonial:
        "Rented a Model Y for a weekend trip to Joshua Tree. Seamless pickup process near Spectrum Center. Mongoori Rides is the future!",
    },
    {
      name: "David Rodriguez",
      location: "Laguna Beach, CA",
      testimonial:
        "Premium service for premium cars. The FSD experience on the PCH was life-changing. I won't go back to gas cars again.",
    },
  ];

  return (
    <div className="py-28 px-6 md:px-16 lg:px-24 xl:px-44 bg-black">
      {/* Title 색상 보정을 위해 Title 컴포넌트 호출 시 className이나 스타일 점검 필요 */}
      <div className="text-white">
        <Title
          title="Tesla Experience Stories"
          subTitle="Discover why Irvine's tech community and travelers choose Mongoori Rides for their premium electric journey."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-18">
        {testimonials.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: index * 0.2,
              ease: "easeOut",
            }}
            viewport={{ once: true }}
            // 다크 모드에 맞는 다크 그레이 배경과 미세한 보더 적용
            className="bg-[#171a20] p-8 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-500 group"
          >
            {/* Avatar & Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:border-accent transition-colors">
                <span className="text-white text-lg font-bold">
                  {item.name.charAt(0)}
                </span>
              </div>

              <div>
                <p className="text-lg font-bold text-white tracking-tight">{item.name}</p>
                <p className="text-accent text-xs font-semibold uppercase tracking-widest">{item.location}</p>
              </div>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1 mt-6">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <img key={i} src={assets.star_icon} alt="star" className="w-3.5 brightness-150" />
                ))}
            </div>

            {/* Testimonial Text */}
            <p className="text-gray-400 mt-5 font-light leading-relaxed italic">
              "{item.testimonial}"
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Testimonial;
