const UserAddress = require("../models/userAddress.model");

class AddressController {
    // Lấy danh sách địa chỉ của user
    async getAddresses(req, res) {
        try {
            const { user_id } = req.params;
            const addresses = await UserAddress.find({ user_id });
            return res.status(200).json({ data: addresses });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // Thêm địa chỉ mới
    async addAddress(req, res) {
        try {
            const { user_id, specific_address, postal_code, is_default } = req.body;
            if (is_default) {
                await UserAddress.updateMany({ user_id }, { is_default: false });
            }
            const newAddress = await UserAddress.create({ user_id, specific_address, postal_code, is_default });
            return res.status(201).json({ message: "Thêm địa chỉ thành công", data: newAddress });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    // Xóa địa chỉ
    async deleteAddress(req, res) {
        try {
            const { id } = req.params;
            await UserAddress.findByIdAndDelete(id);
            return res.status(200).json({ message: "Xóa địa chỉ thành công" });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new AddressController();
