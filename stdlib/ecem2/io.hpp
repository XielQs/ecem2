#pragma once
#include <iostream>
#include <string>

namespace ecem2 {
template <typename T> std::string to_string(const T &val)
{
    if constexpr (std::is_same_v<T, bool>) {
        return val ? "true" : "false";
    } else if constexpr (std::is_same_v<T, std::string>) {
        return val;
    } else {
        return std::to_string(val);
    }
}

template <typename... Args> inline void print(const Args &...args)
{
    ((std::cout << to_string(args) << " "), ...);
    std::cout << std::endl;
}

inline std::string input(const std::string &prompt = "")
{
    if (!prompt.empty())
        std::cout << prompt;
    std::string line;
    std::getline(std::cin, line);
    return line;
}
} // namespace ecem2
