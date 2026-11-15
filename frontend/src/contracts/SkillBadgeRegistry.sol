
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SkillBadgeRegistry
 * @notice Trung tâm đào tạo cấp, thu hồi và xác minh huy hiệu kỹ năng.
 * @dev Mỗi cặp (courseId, student) chỉ được cấp một badge trong suốt vòng đời.
 *      Badge đã thu hồi vẫn được lưu để tra cứu, nhưng không còn hợp lệ.
 */
contract SkillBadgeRegistry {

    // Thông tin của một huy hiệu được lưu trên blockchain.
    struct Badge {
        uint256 id;
        string courseId;
        address holder;
        uint256 issuedAt;
        bool revoked;
    }

    // Ví deploy contract chính là trung tâm đào tạo (Admin).
    address public immutable owner;

    // ID tiếp theo bắt đầu từ 1; ID 0 biểu thị badge không tồn tại.
    uint256 public nextBadgeId = 1;

    // Tra cứu badge theo ID; mapping không tự tạo danh sách các khóa.
    mapping(uint256 => Badge) private badges;

    // Ghi nhận cặp (khóa học, ví học viên) đã từng được cấp hay chưa.
    mapping(bytes32 => bool) private issuedPairs;

    // Event giúp giao diện đọc log cấp hoặc thu hồi badge.
    event BadgeIssued(
        uint256 indexed badgeId,
        address indexed holder,
        string courseId
    );

    event BadgeRevoked(uint256 indexed badgeId);

    /** @dev Chỉ ví trung tâm được gọi hàm có modifier này. */
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only admin can perform this action"
        );
        _;
    }

    /** @notice Ví triển khai contract trở thành Admin. */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Cấp huy hiệu cho một học viên theo mã khóa học.
     * @param student Địa chỉ ví học viên nhận huy hiệu.
     * @param courseId Mã khóa học, so khớp chính xác chữ hoa/chữ thường.
     * @return badgeId ID huy hiệu mới; có thể xem trong event BadgeIssued.
     * @dev Chỉ Admin được cấp; cấm địa chỉ 0, mã rỗng và cấp trùng.
     */
    function issueBadge(
        address student,
        string calldata courseId
    ) external onlyOwner returns (uint256 badgeId) {

        require(
            student != address(0),
            "Invalid student address"
        );

        require(
            bytes(courseId).length > 0,
            "Course ID cannot be empty"
        );

        // Hash của cặp (courseId, student) dùng để kiểm tra tính duy nhất.
        bytes32 pairKey = keccak256(
            abi.encode(courseId, student)
        );

        require(
            !issuedPairs[pairKey],
            "Badge already issued for this pair"
        );

        badgeId = nextBadgeId;
        nextBadgeId += 1;
        issuedPairs[pairKey] = true;

        // block.timestamp là thời gian block chứa giao dịch cấp badge.
        badges[badgeId] = Badge({
            id: badgeId,
            courseId: courseId,
            holder: student,
            issuedAt: block.timestamp,
            revoked: false
        });

        emit BadgeIssued(badgeId, student, courseId);
    }

    /**
     * @notice Thu hồi huy hiệu đã cấp.
     * @param badgeId ID của huy hiệu cần thu hồi.
     * @dev Chỉ Admin được thu hồi. Giữ dữ liệu, đổi revoked thành true.
     */
    function revokeBadge(uint256 badgeId) external onlyOwner {

        require(
            badges[badgeId].id != 0,
            "Badge not found"
        );

        require(
            !badges[badgeId].revoked,
            "Badge already revoked"
        );

        badges[badgeId].revoked = true;

        emit BadgeRevoked(badgeId);
    }

    /**
     * @notice Xác minh badge có tồn tại và chưa bị thu hồi hay không.
     * @param badgeId ID cần kiểm tra.
     * @return valid True nếu tồn tại và chưa bị thu hồi; false nếu không.
     */
    function verifyBadge(
        uint256 badgeId
    ) external view returns (bool valid) {

        return badges[badgeId].id != 0
            && !badges[badgeId].revoked;
    }

    /**
     * @notice Lấy địa chỉ ví học viên sở hữu huy hiệu.
     * @param badgeId ID cần tra cứu.
     * @return Địa chỉ ví học viên; revert nếu badge không tồn tại.
     */
    function getBadgeHolder(
        uint256 badgeId
    ) external view returns (address) {

        require(
            badges[badgeId].id != 0,
            "Badge not found"
        );

        return badges[badgeId].holder;
    }

    /**
     * @notice Lấy thông tin để giao diện hiển thị course, holder và status.
     * @param badgeId ID cần tra cứu.
     * @return Struct Badge; revert nếu badge không tồn tại.
     */
    function getBadge(
        uint256 badgeId
    ) external view returns (Badge memory) {

        require(
            badges[badgeId].id != 0,
            "Badge not found"
        );

        return badges[badgeId];
    }
}
