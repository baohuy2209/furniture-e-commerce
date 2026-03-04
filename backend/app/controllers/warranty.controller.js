const WarrantyRequest = require("../models/warrantyRequests.model");
const WarrantyImage = require("../models/warrantyImage.model");

class WarrantyController {
    // [POST] /api/warranties
    async createWarrantyRequest(req, res) {
        try {
            const { user_id, fullname, email, phone, issue_description, product_variant_id, images } = req.body;

            const newRequest = new WarrantyRequest({
                user_id,
                fullname,
                email,
                phone,
                issue_description,
                product_variant_id,
                request_date: new Date()
            });
            await newRequest.save();

            if (images && images.length > 0) {
                const newImages = new WarrantyImage({
                    warranty_request_id: newRequest._id,
                    image_url: images
                });
                await newImages.save();
            }

            return res.status(200).json({
                message: "Gửi yêu cầu bảo hành thành công",
                data: newRequest,
            });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ message: "Lỗi hệ thống: " + e, data: null });
        }
    }

    // [GET] /api/warranties/user/:user_id
    async getUserWarranties(req, res) {
        try {
            const userId = req.params.user_id;
            const warranties = await WarrantyRequest.find({ user_id: userId }).populate("product_variant_id");
            return res.status(200).json({
                message: "Lấy danh sách bảo hành thành công",
                data: warranties,
            });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ message: "Lỗi hệ thống: " + e, data: null });
        }
    }
}

module.exports = new WarrantyController();
