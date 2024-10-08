import { intervalToDuration } from "date-fns";
import { Request, Response } from "express";
import User from "../models/user";
import Package from "../models/package";
import Wallet from "../models/wallet";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getUserSubscribedPackages = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = req.user;

  try {
    const userSubscribed = await User.findOne({ _id: user.id });
    if (!userSubscribed) {
      return res
        .status(404)
        .send({ status: "error", message: "User not found" });
    } else {
      const userPackages = userSubscribed?.packagesSubscribed || [];
      // making list of duration of packages have been active
      const durations = userPackages.map((item) => {
        const startDate = item.subscribedAt;
        const endDate = new Date();
        if (startDate) {
          const duration = intervalToDuration({
            start: startDate,
            end: endDate,
          });
          const totalDays =
            (duration.years ?? 0) * 365 +
            (duration.months ?? 0) * 30 +
            (duration.months ?? 0);

          return { id: item.packageId, duration: totalDays };
        }
        return { id: item.packageId, duration: 0 };
      });

      const userSubscribedPackageIds =
        userSubscribed?.packagesSubscribed?.map((item) => item.packageId) || [];
      // fetching data of only subcribed packages
      const userPackagesDetails =
        (await Package.find({
          _id: { $in: userSubscribedPackageIds },
        })) || [];
      // now calculating validity of each package
      userPackagesDetails.forEach((item: any) => {
        durations.map((duration) => {
          if (duration.id === item._id) {
            if (duration) {
              const validPeriod = duration.duration - item.validity;
              item.validity = validPeriod;
            }
          }
        });
        return item;
      });

      return res.status(200).send({
        status: "success",
        packages: userPackagesDetails,
      });
    }
  } catch (error) {
    console.error("Get subscribed packages error:", error);
    return res
      .status(500)
      .send({ status: "error", message: "Internal server error" });
  }
};

export const getAllPackages = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (user) {
        const userSubscribed = await User.findOne({ _id: user.id });
        const userSubscribedPackageIds =
          userSubscribed?.packagesSubscribed?.map((item) => item.packageId) || [];
        // getting only those packages which user has not subscribed
        const packages = await Package.find({
          _id: { $nin: userSubscribedPackageIds },
        });
  
        return res.status(200).send({ status: "success", packages: packages });
      } else {
        return res.status(401).send({ status: "error", message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Get packages error:", error);
      return res
        .status(500)
        .send({ status: "error", message: "Internal server error" });
    }
  };


export const subscribeToPackage = async (req: AuthenticatedRequest, res: Response) => {
const { packageId } = req.body;
const user = req.user;

try {
    const packageToSubscribe = await Package.findOne({ _id: packageId });
    if (!packageToSubscribe) {
    return res
        .status(404)
        .send({ status: "error", message: "Package not found" });
    } else {
    const userSubscribed = await User.findOne({ _id: user.id });
    const walletOfUser = await Wallet.findOne({ userId: user.id });
    if (!userSubscribed || !walletOfUser) {
        return res
        .status(404)
        .send({ status: "error", message: "User or wallet not found" });
    } else {
        userSubscribed.packagesSubscribed?.push({
        packageId: packageId,
        });
        walletOfUser.stackedCoins += packageToSubscribe.profit;
        walletOfUser.smartCoin -= packageToSubscribe.profit;
        await userSubscribed.save();
        await walletOfUser.save();
        return res
        .status(200)
        .send({ status: "success", message: "Subscribed successfully" });
    }
    }
} catch (error) {
    console.error("Subscription error:", error);
    return res
    .status(500)
    .send({ status: "error", message: "Internal server error" });
}
};
