#pragma once
#include <random>
#include <string>

namespace ecem2 {
inline int randomInt(int min, int max)
{
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> distrib(min, max);

    return distrib(gen);
}

inline std::string randomString(int length)
{
    const std::string chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    std::string result;
    for (int i = 0; i < length; ++i) {
        result += chars[randomInt(0, chars.size() - 1)];
    }

    return result;
}
} // namespace ecem2
