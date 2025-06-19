#pragma once
#include <iostream>
#include <string>

namespace ecem2 {
    template <typename T>
    std::string to_string(const T& val) {
        if constexpr (std::is_same_v<T, bool>) {
            return val ? "true" : "false";
        } else if constexpr (std::is_same_v<T, std::string>) {
            return val;
        } else {
            return std::to_string(val);
        }
    }

    template <typename... Args>
    inline void print(const Args&... args) {
        ((std::cout << to_string(args) << " "), ...);
        std::cout << std::endl;
    }
}
